from __future__ import annotations

from datetime import UTC, datetime, timedelta
import logging

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_redis
from app.models.market import Signal

logger = logging.getLogger(__name__)

BINANCE_REST_FALLBACK_URLS = (
    "https://data-api.binance.vision",
    "https://api1.binance.com",
)

BINANCE_FUTURES_URLS = (
    "https://fapi.binance.com",
    "https://fapi1.binance.com",
)

STABLE_OR_LEVERAGED_SUFFIXES = (
    "UPUSDT",
    "DOWNUSDT",
    "BULLUSDT",
    "BEARUSDT",
    "USDCUSDT",
    "BUSDUSDT",
    "FDUSDUSDT",
    "TUSDUSDT",
    "USDPUSDT",
    "DAIUSDT",
)

COINGECKO_SYMBOL_IDS = {
    "BTCUSDT": "bitcoin",
    "ETHUSDT": "ethereum",
    "SOLUSDT": "solana",
    "BNBUSDT": "binancecoin",
    "XRPUSDT": "ripple",
    "DOGEUSDT": "dogecoin",
    "ADAUSDT": "cardano",
    "AVAXUSDT": "avalanche-2",
    "LINKUSDT": "chainlink",
    "MATICUSDT": "polygon-ecosystem-token",
    "DOTUSDT": "polkadot",
    "ATOMUSDT": "cosmos",
    "LTCUSDT": "litecoin",
    "NEARUSDT": "near",
    "TRXUSDT": "tron",
    "SUIUSDT": "sui",
    "APTUSDT": "aptos",
    "UNIUSDT": "uniswap",
    "BCHUSDT": "bitcoin-cash",
    "PEPEUSDT": "pepe",
    "SHIBUSDT": "shiba-inu",
    "TONUSDT": "the-open-network",
    "FILUSDT": "filecoin",
    "AAVEUSDT": "aave",
    "INJUSDT": "injective-protocol",
    "ARBUSDT": "arbitrum",
    "OPUSDT": "optimism",
    "WLDUSDT": "worldcoin-wld",
    "SEIUSDT": "sei-network",
    "RENDERUSDT": "render-token",
    "FETUSDT": "artificial-superintelligence-alliance",
    "TAOUSDT": "bittensor",
    "JUPUSDT": "jupiter-exchange-solana",
    "ONDOUSDT": "ondo-finance",
    "ENAUSDT": "ethena",
    "WIFUSDT": "dogwifcoin",
    "BONKUSDT": "bonk",
    "PYTHUSDT": "pyth-network",
    "TIAUSDT": "celestia",
    "IMXUSDT": "immutable-x",
    "PENDLEUSDT": "pendle",
    "LDOUSDT": "lido-dao",
}

EXTERNAL_YAHOO_MARKETS = {
    "XAUUSD": {"yahoo": "GC=F", "name": "Gold Futures"},
    "XAGUSD": {"yahoo": "SI=F", "name": "Silver Futures"},
    "USOIL": {"yahoo": "CL=F", "name": "WTI Crude Oil"},
    "UKOIL": {"yahoo": "BZ=F", "name": "Brent Crude Oil"},
}

CRYPTO_YAHOO_MARKETS = {
    "BTCUSDT": {"yahoo": "BTC-USD", "name": "Bitcoin"},
    "ETHUSDT": {"yahoo": "ETH-USD", "name": "Ethereum"},
    "SOLUSDT": {"yahoo": "SOL-USD", "name": "Solana"},
    "XRPUSDT": {"yahoo": "XRP-USD", "name": "XRP"},
    "DOGEUSDT": {"yahoo": "DOGE-USD", "name": "Dogecoin"},
}


def yahoo_interval_config(interval: str) -> tuple[str, str, int]:
    normalized = interval.lower()
    if normalized in {"1m", "5m"}:
        return "5m", "5d", 1
    if normalized == "15m":
        return "15m", "30d", 1
    if normalized == "30m":
        return "30m", "30d", 1
    if normalized == "1h":
        return "60m", "60d", 1
    if normalized == "4h":
        return "60m", "60d", 4
    if normalized == "1d":
        return "1d", "1y", 1
    return "60m", "60d", 1


def aggregate_candles(candles: list[dict], group_size: int) -> list[dict]:
    if group_size <= 1:
        return candles
    aggregated: list[dict] = []
    for start in range(0, len(candles), group_size):
        group = candles[start : start + group_size]
        if len(group) < group_size:
            continue
        aggregated.append(
            {
                "open_time": group[0]["open_time"],
                "open": float(group[0]["open"]),
                "high": max(float(item["high"]) for item in group),
                "low": min(float(item["low"]) for item in group),
                "close": float(group[-1]["close"]),
                "volume": sum(float(item.get("volume", 0)) for item in group),
            }
        )
    return aggregated


def is_clean_usdt_symbol(symbol: str) -> bool:
    if not symbol.endswith("USDT"):
        return False
    if any(symbol.endswith(suffix) for suffix in STABLE_OR_LEVERAGED_SUFFIXES):
        return False
    if any(token in symbol for token in ("1000", "2L", "2S", "3L", "3S", "5L", "5S")):
        return False
    return True


def fallback_hot_symbols() -> list[str]:
    return [
        "BTCUSDT",
        "ETHUSDT",
        "SOLUSDT",
        "BNBUSDT",
        "XRPUSDT",
        "DOGEUSDT",
        "ADAUSDT",
        "AVAXUSDT",
        "LINKUSDT",
        "SUIUSDT",
        "APTUSDT",
        "UNIUSDT",
        "BCHUSDT",
        "TONUSDT",
        "FILUSDT",
        "LTCUSDT",
        "DOTUSDT",
        "NEARUSDT",
        "OPUSDT",
        "ARBUSDT",
        "INJUSDT",
        "PEPEUSDT",
        "SHIBUSDT",
        "AAVEUSDT",
        "WLDUSDT",
        "SEIUSDT",
        "RENDERUSDT",
        "FETUSDT",
        "TAOUSDT",
        "JUPUSDT",
        "ONDOUSDT",
        "ENAUSDT",
        "WIFUSDT",
        "BONKUSDT",
        "PYTHUSDT",
        "TIAUSDT",
        "IMXUSDT",
        "PENDLEUSDT",
        "LDOUSDT",
    ]


def candle_cache_ttl(interval: str) -> int:
    normalized = interval.lower()
    if normalized in {"1m", "5m", "15m"}:
        return 90
    if normalized in {"30m", "1h"}:
        return 180
    return 600


class MarketService:
    def __init__(self, db: AsyncSession | None = None):
        self.db = db

    async def fetch_dashboard(self) -> list[dict]:
        redis = await get_redis()
        data: list[dict] = []
        missing: list[str] = []
        for symbol in settings.tracked_symbols:
            ticker = await redis.hgetall(f"ticker:{symbol}")
            meta = await redis.hgetall(f"meta:{symbol}")
            updated_at = float(ticker.get("updated_at", 0) or 0) if ticker else 0
            is_fresh = bool(updated_at) and ((datetime.now(UTC).timestamp() - updated_at) <= 15)
            if ticker and is_fresh:
                data.append(
                    {
                        "symbol": symbol,
                        "price": float(ticker.get("price", 0)),
                        "change_24h": float(ticker.get("change_24h", 0)),
                        "volume_24h": float(ticker.get("volume_24h", 0)),
                        "metadata_name": meta.get("name"),
                        "metadata_image": meta.get("image"),
                    }
                )
            else:
                missing.append(symbol)

        for symbol in settings.tracked_metals:
            external = await self.fetch_external_market_ticker(symbol)
            if external:
                data.append(external)

        if missing:
            fallback = await self.fetch_rest_tickers(missing)
            for item in fallback:
                await redis.hset(
                    f"ticker:{item['symbol']}",
                    mapping={
                        "symbol": item["symbol"],
                        "price": str(item["price"]),
                        "change_24h": str(item["change_24h"]),
                        "volume_24h": str(item["volume_24h"]),
                        "updated_at": str(datetime.now(UTC).timestamp()),
                    },
                )
            data.extend(fallback)

        return sorted(data, key=lambda item: item["volume_24h"], reverse=True)

    async def fetch_rest_tickers(self, symbols: list[str]) -> list[dict]:
        if not symbols:
            return []

        errors: list[str] = []
        for base_url in self.binance_rest_urls():
            try:
                return await self.fetch_binance_rest_tickers(symbols, base_url)
            except httpx.HTTPError as exc:
                errors.append(f"{base_url}: {exc.__class__.__name__}")
                logger.warning("Binance ticker fetch failed via %s: %s", base_url, exc)

        logger.warning("Falling back to CoinGecko ticker data after Binance failures: %s", "; ".join(errors))
        return await self.fetch_coingecko_tickers(symbols)

    async def fetch_hot_usdt_symbols(self, *, limit: int | None = None) -> list[str]:
        target_limit = limit or settings.telegram_hot_symbol_count
        try:
            tickers = await self.fetch_binance_futures_tickers()
        except httpx.HTTPError as exc:
            logger.warning("Binance futures discovery failed: %s", exc)
            tickers = []

        if not tickers:
            try:
                tickers = await self.fetch_binance_all_spot_tickers()
            except httpx.HTTPError as exc:
                logger.warning("Binance spot discovery failed: %s", exc)
                tickers = []

        if not tickers:
            return fallback_hot_symbols()[:target_limit]

        ranked: list[tuple[float, str]] = []
        for item in tickers:
            symbol = str(item.get("symbol", "")).upper()
            if not is_clean_usdt_symbol(symbol):
                continue
            quote_volume = float(item.get("quoteVolume") or item.get("quote_volume") or 0)
            if quote_volume < settings.telegram_min_hot_quote_volume:
                continue
            change = abs(float(item.get("priceChangePercent") or item.get("price_change_percent") or 0))
            count = float(item.get("count") or 0)
            score = quote_volume * (1 + min(change, 30) / 12) + count * 50_000
            ranked.append((score, symbol))

        symbols: list[str] = []
        for _, symbol in sorted(ranked, reverse=True):
            if symbol not in symbols:
                symbols.append(symbol)
            if len(symbols) >= target_limit:
                break
        return symbols or fallback_hot_symbols()[:target_limit]

    async def fetch_binance_futures_tickers(self) -> list[dict]:
        for base_url in BINANCE_FUTURES_URLS:
            try:
                async with httpx.AsyncClient(timeout=20) as client:
                    response = await client.get(f"{base_url}/fapi/v1/ticker/24hr")
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 451:
                    logger.info("Binance futures discovery is region-blocked; using fallback discovery provider.")
                    return []
                raise
        return []

    async def fetch_binance_all_spot_tickers(self) -> list[dict]:
        for base_url in self.binance_rest_urls():
            try:
                async with httpx.AsyncClient(timeout=20) as client:
                    response = await client.get(f"{base_url}/api/v3/ticker/24hr")
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 451:
                    logger.info("Binance spot discovery is region-blocked; using fallback symbol universe.")
                    return []
                raise
        return []

    async def fetch_binance_rest_tickers(self, symbols: list[str], base_url: str) -> list[dict]:
        joined = ",".join([f'"{symbol}"' for symbol in symbols])
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{base_url}/api/v3/ticker/24hr",
                params={"symbols": f"[{joined}]"},
            )
            response.raise_for_status()
            data = response.json()
        return [
            {
                "symbol": item["symbol"],
                "price": float(item["lastPrice"]),
                "change_24h": float(item["priceChangePercent"]),
                "volume_24h": float(item["quoteVolume"]),
                "metadata_name": None,
                "metadata_image": None,
            }
            for item in data
        ]

    async def fetch_coingecko_tickers(self, symbols: list[str]) -> list[dict]:
        id_to_symbol = {
            coin_id: symbol
            for symbol in symbols
            if (coin_id := COINGECKO_SYMBOL_IDS.get(symbol))
        }
        if not id_to_symbol:
            return []

        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.get(
                f"{settings.coingecko_url}/simple/price",
                params={
                    "ids": ",".join(id_to_symbol.keys()),
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_24hr_vol": "true",
                },
            )
            response.raise_for_status()
            payload = response.json()

        rows: list[dict] = []
        for coin_id, symbol in id_to_symbol.items():
            item = payload.get(coin_id) or {}
            price = item.get("usd")
            if price is None:
                continue
            rows.append(
                {
                    "symbol": symbol,
                    "price": float(price),
                    "change_24h": float(item.get("usd_24h_change") or 0),
                    "volume_24h": float(item.get("usd_24h_vol") or 0),
                    "metadata_name": None,
                    "metadata_image": None,
                }
            )
        return rows

    async def fetch_metal_ticker(self, symbol: str, *, use_cache: bool = True) -> dict | None:
        return await self.fetch_external_market_ticker(symbol, use_cache=use_cache)

    async def fetch_external_market_ticker(self, symbol: str, *, use_cache: bool = True) -> dict | None:
        config = EXTERNAL_YAHOO_MARKETS.get(symbol)
        if not config:
            return None
        redis = await get_redis()
        cached = await redis.hgetall(f"ticker:{symbol}")
        cached_updated = cached.get("updated_at") if cached else None
        if use_cache and cached and cached_updated:
            age = datetime.now(UTC).timestamp() - float(cached_updated)
            if age <= 10:
                return {
                    "symbol": symbol,
                    "price": float(cached.get("price", 0)),
                    "change_24h": float(cached.get("change_24h", 0)),
                    "volume_24h": float(cached.get("volume_24h", 0)),
                    "metadata_name": str(config["name"]),
                    "metadata_image": None,
                }

        if use_cache and cached and not cached_updated:
            return {
                "symbol": symbol,
                "price": float(cached.get("price", 0)),
                "change_24h": float(cached.get("change_24h", 0)),
                "volume_24h": float(cached.get("volume_24h", 0)),
                "metadata_name": str(config["name"]),
                "metadata_image": None,
            }

        try:
            ticker = await self.fetch_yahoo_chart_ticker(str(config["yahoo"]), symbol, str(config["name"]))
        except httpx.HTTPError as exc:
            logger.warning("Yahoo ticker fetch failed for %s: %s", symbol, exc)
            ticker = await self.fetch_legacy_gold_api_ticker() if symbol == "XAUUSD" else None
        if not ticker:
            return None
        await redis.hset(
            f"ticker:{symbol}",
            mapping={
                "symbol": symbol,
                "price": str(ticker["price"]),
                "change_24h": str(ticker["change_24h"]),
                "volume_24h": str(ticker["volume_24h"]),
                "updated_at": str(datetime.now(UTC).timestamp()),
            },
        )
        return ticker

    async def fetch_legacy_gold_api_ticker(self) -> dict | None:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get("https://api.gold-api.com/price/XAU")
            response.raise_for_status()
            payload = response.json()

        price = float(payload.get("price", 0))
        previous_price = float(payload.get("prev_close_price", price or 1))
        change_24h = ((price - previous_price) / previous_price * 100) if previous_price else 0
        ticker = {
            "symbol": "XAUUSD",
            "price": price,
            "change_24h": change_24h,
            "volume_24h": 0.0,
            "metadata_name": "Gold Spot",
            "metadata_image": None,
        }
        return ticker

    async def fetch_oil_ticker(self, symbol: str) -> dict | None:
        if symbol == "USOIL":
            return await self.fetch_yahoo_chart_ticker("CL=F", "USOIL", "WTI Crude Oil")
        if symbol == "UKOIL":
            return await self.fetch_yahoo_chart_ticker("BZ=F", "UKOIL", "Brent Crude Oil")
        return None

    async def fetch_yahoo_chart_ticker(self, yahoo_symbol: str, output_symbol: str, name: str) -> dict | None:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_symbol}",
                params={"range": "5d", "interval": "1d"},
                headers={"User-Agent": "Vypexrock/1.0"},
            )
            response.raise_for_status()
            payload = response.json()

        result = (payload.get("chart", {}).get("result") or [None])[0]
        if not result:
            return None
        meta = result.get("meta", {})
        quote = ((result.get("indicators") or {}).get("quote") or [{}])[0]
        closes = [float(value) for value in quote.get("close", []) if value is not None]
        volumes = [float(value) for value in quote.get("volume", []) if value is not None]
        price = float(meta.get("regularMarketPrice") or (closes[-1] if closes else 0))
        previous = float(meta.get("chartPreviousClose") or (closes[-2] if len(closes) >= 2 else price or 1))
        change_24h = ((price - previous) / previous * 100) if previous else 0
        return {
            "symbol": output_symbol,
            "price": price,
            "change_24h": change_24h,
            "volume_24h": float(meta.get("regularMarketVolume") or (volumes[-1] if volumes else 0)),
            "metadata_name": name,
            "metadata_image": None,
        }

    async def fetch_candles(self, symbol: str, interval: str, limit: int = 150) -> list[dict]:
        import json

        redis = await get_redis()
        cache_key = f"candle_cache:{symbol}:{interval}:{limit}"
        cached_payload = await redis.get(cache_key)
        if cached_payload:
            try:
                return json.loads(cached_payload)
            except json.JSONDecodeError:
                pass

        if symbol in EXTERNAL_YAHOO_MARKETS:
            candles = await self.fetch_external_market_candles(symbol, interval, limit)
            await redis.setex(cache_key, candle_cache_ttl(interval), json.dumps(candles))
            return candles

        cached = await redis.lrange(f"candles:{symbol}:{interval}", 0, limit - 1)
        if cached:
            return [json.loads(item) for item in reversed(cached)]

        rows = await self.fetch_binance_klines(symbol, interval, limit)
        if rows:
            candles = self.normalize_kline_rows(rows)
            await redis.setex(cache_key, candle_cache_ttl(interval), json.dumps(candles))
            return candles

        if symbol in CRYPTO_YAHOO_MARKETS:
            try:
                candles = await self.fetch_yahoo_crypto_candles(symbol, interval, limit)
                await redis.setex(cache_key, candle_cache_ttl(interval), json.dumps(candles))
                return candles
            except (httpx.HTTPError, ValueError) as exc:
                logger.warning("Yahoo crypto candle fallback failed for %s %s: %s", symbol, interval, exc)

        if not rows:
            rows = await self.fetch_coingecko_candles(symbol, interval, limit)
        candles = self.normalize_kline_rows(rows)
        await redis.setex(cache_key, candle_cache_ttl(interval), json.dumps(candles))
        return candles

    def normalize_kline_rows(self, rows: list[list]) -> list[dict]:
        return [
            {
                "open_time": datetime.fromtimestamp(item[0] / 1000, tz=UTC).isoformat(),
                "open": float(item[1]),
                "high": float(item[2]),
                "low": float(item[3]),
                "close": float(item[4]),
                "volume": float(item[5]),
            }
            for item in rows
        ]

    async def fetch_binance_klines(self, symbol: str, interval: str, limit: int) -> list[list]:
        for base_url in self.binance_rest_urls():
            try:
                async with httpx.AsyncClient(timeout=20) as client:
                    response = await client.get(
                        f"{base_url}/api/v3/klines",
                        params={"symbol": symbol, "interval": interval, "limit": limit},
                    )
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 451:
                    logger.debug("Binance kline feed is region-blocked for %s %s; using fallback provider.", symbol, interval)
                    return []
                logger.warning("Binance kline fetch failed for %s via %s: %s", symbol, base_url, exc)
            except httpx.HTTPError as exc:
                logger.warning("Binance kline fetch failed for %s via %s: %s", symbol, base_url, exc)
        return []

    async def fetch_external_market_candles(self, symbol: str, interval: str, limit: int = 150) -> list[dict]:
        config = EXTERNAL_YAHOO_MARKETS.get(symbol)
        if not config:
            raise ValueError(f"no external provider available for {symbol}")

        yahoo_interval, yahoo_range, aggregate = yahoo_interval_config(interval)
        async with httpx.AsyncClient(timeout=25, headers={"User-Agent": "Vypexrock/1.0"}) as client:
            response = await client.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{config['yahoo']}",
                params={"range": yahoo_range, "interval": yahoo_interval, "includePrePost": "true"},
            )
            response.raise_for_status()
            payload = response.json()

        result = (payload.get("chart", {}).get("result") or [None])[0]
        if not result:
            raise ValueError(f"no Yahoo candle data available for {symbol}")
        timestamps = result.get("timestamp") or []
        quote = ((result.get("indicators") or {}).get("quote") or [{}])[0]
        rows: list[dict] = []
        for index, timestamp in enumerate(timestamps):
            try:
                open_price = quote["open"][index]
                high = quote["high"][index]
                low = quote["low"][index]
                close = quote["close"][index]
            except (IndexError, KeyError):
                continue
            if None in {open_price, high, low, close}:
                continue
            volumes = quote.get("volume") or []
            volume = volumes[index] if index < len(volumes) and volumes[index] is not None else 0
            rows.append(
                {
                    "open_time": datetime.fromtimestamp(int(timestamp), tz=UTC).isoformat(),
                    "open": float(open_price),
                    "high": float(high),
                    "low": float(low),
                    "close": float(close),
                    "volume": float(volume),
                }
            )

        if aggregate > 1:
            rows = aggregate_candles(rows, aggregate)
        if not rows:
            raise ValueError(f"no usable Yahoo candle data available for {symbol}")
        return rows[-limit:]

    async def fetch_yahoo_crypto_candles(self, symbol: str, interval: str, limit: int = 150) -> list[dict]:
        config = CRYPTO_YAHOO_MARKETS.get(symbol)
        if not config:
            raise ValueError(f"no Yahoo crypto provider available for {symbol}")
        yahoo_interval, yahoo_range, aggregate = yahoo_interval_config(interval)
        async with httpx.AsyncClient(timeout=25, headers={"User-Agent": "Vypexrock/1.0"}) as client:
            response = await client.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{config['yahoo']}",
                params={"range": yahoo_range, "interval": yahoo_interval, "includePrePost": "true"},
            )
            response.raise_for_status()
            payload = response.json()

        result = (payload.get("chart", {}).get("result") or [None])[0]
        if not result:
            raise ValueError(f"no Yahoo candle data available for {symbol}")
        timestamps = result.get("timestamp") or []
        quote = ((result.get("indicators") or {}).get("quote") or [{}])[0]
        rows: list[dict] = []
        for index, timestamp in enumerate(timestamps):
            try:
                open_price = quote["open"][index]
                high = quote["high"][index]
                low = quote["low"][index]
                close = quote["close"][index]
            except (IndexError, KeyError):
                continue
            if None in {open_price, high, low, close}:
                continue
            volumes = quote.get("volume") or []
            volume = volumes[index] if index < len(volumes) and volumes[index] is not None else 0
            rows.append(
                {
                    "open_time": datetime.fromtimestamp(int(timestamp), tz=UTC).isoformat(),
                    "open": float(open_price),
                    "high": float(high),
                    "low": float(low),
                    "close": float(close),
                    "volume": float(volume),
                }
            )

        if aggregate > 1:
            rows = aggregate_candles(rows, aggregate)
        if not rows:
            raise ValueError(f"no usable Yahoo candle data available for {symbol}")
        return rows[-limit:]

    async def fetch_coingecko_candles(self, symbol: str, interval: str, limit: int) -> list[list]:
        coin_id = COINGECKO_SYMBOL_IDS.get(symbol)
        if not coin_id:
            raise ValueError(f"no market data provider available for {symbol}")

        interval_days = {
            "1m": 1,
            "1s": 1,
            "5m": 1,
            "15m": 1,
            "30m": 7,
            "1h": 7,
            "4h": 30,
            "1d": 180,
            "1w": 365,
        }
        days = interval_days.get(interval.lower(), 30)
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.get(
                f"{settings.coingecko_url}/coins/{coin_id}/ohlc",
                params={"vs_currency": "usd", "days": days},
            )
            response.raise_for_status()
            rows = response.json()

        if not rows:
            raise ValueError(f"no CoinGecko candles available for {symbol}")

        # CoinGecko OHLC rows do not include volume. Keep the kline shape expected by callers.
        return [
            [
                item[0],
                str(item[1]),
                str(item[2]),
                str(item[3]),
                str(item[4]),
                "0",
            ]
            for item in rows[-limit:]
        ]

    def binance_rest_urls(self) -> list[str]:
        seen: set[str] = set()
        urls: list[str] = []
        for url in (settings.binance_rest_url, *BINANCE_REST_FALLBACK_URLS):
            normalized = url.rstrip("/")
            if normalized and normalized not in seen:
                seen.add(normalized)
                urls.append(normalized)
        return urls

    async def fetch_metal_candles(self, interval: str, limit: int = 150) -> list[dict]:
        ticker = await self.fetch_metal_ticker("XAUUSD")
        base_price = float(ticker["price"]) if ticker else 3300.0
        now = datetime.now(UTC)
        interval_map = {
            "15m": 15,
            "30m": 30,
            "1h": 60,
            "4h": 240,
            "1d": 1440,
        }
        step_minutes = interval_map.get(interval, 60)

        candles: list[dict] = []
        for idx in range(limit):
            offset = limit - idx
            drift = ((idx % 7) - 3) * base_price * 0.0009
            wave = (((idx * 13) % 11) - 5) * base_price * 0.00035
            close = base_price + drift + wave
            open_price = close - (base_price * 0.0008)
            candles.append(
                {
                    "open_time": (now - timedelta(minutes=offset * step_minutes)).isoformat(),
                    "open": round(open_price, 2),
                    "high": round(close + base_price * 0.0016, 2),
                    "low": round(close - base_price * 0.0018, 2),
                    "close": round(close, 2),
                    "volume": round(900 + idx * 6.5, 2),
                }
            )
        return candles

    async def latest_signals(self, symbol: str) -> list[Signal]:
        if not self.db:
            return []
        result = await self.db.execute(select(Signal).where(Signal.symbol == symbol).order_by(Signal.timeframe))
        return list(result.scalars().all())
