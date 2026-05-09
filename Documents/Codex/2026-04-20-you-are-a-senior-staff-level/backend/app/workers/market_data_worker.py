from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime

import httpx
import websockets

from app.core.config import settings
from app.db.session import get_redis


def _stream_url() -> str:
    streams = "/".join([f"{symbol.lower()}@ticker" for symbol in settings.tracked_symbols])
    return f"{settings.binance_ws_url}?streams={streams}"


async def seed_metadata() -> None:
    print("START seed_metadata")
    redis = await get_redis()

    symbol_to_id = {
        "BTCUSDT": "bitcoin",
        "ETHUSDT": "ethereum",
        "SOLUSDT": "solana",
        "BNBUSDT": "binancecoin",
        "XRPUSDT": "ripple",
        "DOGEUSDT": "dogecoin",
        "ADAUSDT": "cardano",
        "AVAXUSDT": "avalanche-2",
        "LINKUSDT": "chainlink",
        "MATICUSDT": "matic-network",
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
    }

    ids = ",".join(symbol_to_id.values())

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            f"{settings.coingecko_url}/coins/markets",
            params={"vs_currency": "usd", "ids": ids},
        )
        response.raise_for_status()
        rows = response.json()

    symbol_map = {symbol: next((item for item in rows if item["id"] == coin_id), None) for symbol, coin_id in symbol_to_id.items()}
    for symbol, item in symbol_map.items():
        if not item:
            continue
        await redis.hset(
            f"meta:{symbol}",
            mapping={"name": item["name"], "image": item["image"]},
        )

    print(f"DONE seed_metadata: {len(symbol_map)} items")


async def refresh_candles(symbol: str, interval: str = "1h", limit: int = 150) -> None:
    print(f"REFRESH candles: symbol={symbol} interval={interval} limit={limit}")
    redis = await get_redis()

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            f"{settings.binance_rest_url}/api/v3/klines",
            params={"symbol": symbol, "interval": interval, "limit": limit},
        )
        response.raise_for_status()
        rows = response.json()

    key = f"candles:{symbol}:{interval}"
    await redis.delete(key)

    for item in rows:
        candle = {
            "open_time": datetime.fromtimestamp(item[0] / 1000, UTC).isoformat(),
            "open": float(item[1]),
            "high": float(item[2]),
            "low": float(item[3]),
            "close": float(item[4]),
            "volume": float(item[5]),
        }
        await redis.lpush(key, json.dumps(candle))

    await redis.ltrim(key, 0, settings.websocket_history_limit)
    print(f"DONE candles: key={key} count={len(rows)}")


async def refresh_all_candles() -> None:
    print("START refresh_all_candles")
    for symbol in settings.tracked_symbols:
        for interval in ["15m", "1h", "4h", "1d"]:
            try:
                await refresh_candles(symbol, interval)
            except Exception as e:
                print(f"ERROR refresh_candles symbol={symbol} interval={interval}: {e}")
    print("DONE refresh_all_candles")


async def refresh_metals() -> None:
    redis = await get_redis()
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get("https://api.gold-api.com/price/XAU")
        response.raise_for_status()
        payload = response.json()

    price = float(payload.get("price", 0))
    previous_price = float(payload.get("prev_close_price", price or 1))
    change_24h = ((price - previous_price) / previous_price * 100) if previous_price else 0
    ticker = {
        "symbol": "XAUUSD",
        "price": str(price),
        "change_24h": str(change_24h),
        "volume_24h": "0",
        "updated_at": str(datetime.now(UTC).timestamp()),
    }
    await redis.hset("ticker:XAUUSD", mapping=ticker)
    await redis.hset("meta:XAUUSD", mapping={"name": "Gold Spot"})
    await redis.publish("market-stream", json.dumps(ticker))


async def consume_market_stream() -> None:
    print("START consume_market_stream")
    redis = await get_redis()

    while True:
        try:
            url = _stream_url()
            print(f"CONNECTING TO BINANCE WS: {url}")

            async with websockets.connect(url, ping_interval=20, ping_timeout=20) as websocket:
                print("CONNECTED TO BINANCE WS")

                async for raw_message in websocket:
                    print("MESSAGE RECEIVED")
                    payload = json.loads(raw_message)
                    data = payload.get("data", {})
                    symbol = data.get("s")

                    if not symbol:
                        print(f"SKIP message without symbol: {payload}")
                        continue

                    ticker = {
                        "symbol": symbol,
                        "price": data.get("c", "0"),
                        "change_24h": data.get("P", "0"),
                        "volume_24h": data.get("q", "0"),
                        "updated_at": str(datetime.now(UTC).timestamp()),
                    }

                    print(f"WRITING TO REDIS: {ticker}")
                    await redis.hset(f"ticker:{symbol}", mapping=ticker)
                    await redis.publish("market-stream", json.dumps(ticker))

        except Exception as e:
            print(f"STREAM ERROR: {e}")
            await asyncio.sleep(5)


async def periodic_candle_refresh() -> None:
    print("START periodic_candle_refresh")
    while True:
        try:
            await refresh_all_candles()
            await refresh_metals()
        except Exception as e:
            print(f"ERROR periodic_candle_refresh: {e}")

        sleep_seconds = settings.market_poll_interval_seconds * 4
        print(f"SLEEP periodic_candle_refresh: {sleep_seconds}s")
        await asyncio.sleep(sleep_seconds)


async def periodic_metal_refresh() -> None:
    while True:
        try:
            await refresh_metals()
        except Exception as e:
            print(f"ERROR periodic_metal_refresh: {e}")
        await asyncio.sleep(settings.market_poll_interval_seconds)


async def main() -> None:
    print("START market_data_worker main")

    try:
        await seed_metadata()
    except Exception as e:
        print(f"ERROR seed_metadata: {e}")

    try:
        await refresh_all_candles()
    except Exception as e:
        print(f"ERROR initial refresh_all_candles: {e}")

    await asyncio.gather(
        consume_market_stream(),
        periodic_candle_refresh(),
        periodic_metal_refresh(),
    )


if __name__ == "__main__":
    asyncio.run(main())
