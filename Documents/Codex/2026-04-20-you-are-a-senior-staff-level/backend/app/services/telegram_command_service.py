from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from typing import Any

import httpx

from app.core.config import settings
from app.db.session import get_redis
from app.services.ai_service import AIExplanationService
from app.services.market_service import MarketService
from app.services.signal_alert_service import market_update_symbols
from app.services.signal_alert_service import top_market_rows
from app.services.telegram_service import TELEGRAM_API_BASE
from app.services.telegram_service import send_telegram_message


SYMBOL_ALIASES = {
    "BTC": "BTCUSDT",
    "ETH": "ETHUSDT",
    "SOL": "SOLUSDT",
    "BNB": "BNBUSDT",
    "XRP": "XRPUSDT",
    "DOGE": "DOGEUSDT",
    "ADA": "ADAUSDT",
    "AVAX": "AVAXUSDT",
    "LINK": "LINKUSDT",
    "SUI": "SUIUSDT",
    "TON": "TONUSDT",
    "PEPE": "PEPEUSDT",
    "SHIB": "SHIBUSDT",
    "LTC": "LTCUSDT",
    "DOT": "DOTUSDT",
    "NEAR": "NEARUSDT",
    "INJ": "INJUSDT",
    "GOLD": "XAUUSD",
    "XAU": "XAUUSD",
    "XAUUSD": "XAUUSD",
    "OIL": "USOIL",
    "WTI": "USOIL",
    "USOIL": "USOIL",
    "CL": "USOIL",
    "BRENT": "UKOIL",
    "UKOIL": "UKOIL",
}

YAHOO_SYMBOL_ALIASES = {
    "EURUSD": ("EURUSD=X", "EURUSD", "Euro / U.S. Dollar"),
    "GBPUSD": ("GBPUSD=X", "GBPUSD", "British Pound / U.S. Dollar"),
    "USDJPY": ("JPY=X", "USDJPY", "U.S. Dollar / Japanese Yen"),
    "US100": ("NQ=F", "US100", "Nasdaq 100 Futures"),
    "NAS100": ("NQ=F", "NAS100", "Nasdaq 100 Futures"),
    "SPX": ("^GSPC", "SPX", "S&P 500"),
    "SP500": ("^GSPC", "SP500", "S&P 500"),
    "DXY": ("DX-Y.NYB", "DXY", "U.S. Dollar Index"),
    "SILVER": ("SI=F", "XAGUSD", "Silver Futures"),
    "XAG": ("SI=F", "XAGUSD", "Silver Futures"),
    "XAGUSD": ("SI=F", "XAGUSD", "Silver Futures"),
}


HELP_TEXT = "\n".join(
    [
        "Vypexrock Bot Commands",
        "",
        "Send BTC for live price",
        "Send /price BTC for live price",
        "Send /market for top 15 live assets",
        "Send /signal for latest best setup if available",
        "Send /ask your question for Vypexrock AI",
        "Send a chart screenshot for AI chart review",
        "",
        "Examples: BTC, ETHUSDT, PEPE, GOLD, OIL, /ask is BTC overextended?",
    ]
)


class TelegramCommandService:
    def __init__(self):
        self.market_service = MarketService()
        self.ai_service = AIExplanationService()

    async def poll_and_handle_updates(self) -> dict[str, Any]:
        if not settings.telegram_bot_token:
            return {"status": "skipped", "reason": "TELEGRAM_BOT_TOKEN missing", "processed": 0}

        redis = await get_redis()
        lock_acquired = await redis.set("telegram:command_poll_lock", "1", ex=max(settings.telegram_command_poll_seconds - 1, 5), nx=True)
        if not lock_acquired:
            return {"status": "skipped", "reason": "poll already running", "processed": 0}

        offset_raw = await redis.get("telegram:commands:last_update_id")
        offset = int(offset_raw) + 1 if offset_raw else None
        params: dict[str, Any] = {"timeout": 0, "limit": 25, "allowed_updates": json.dumps(["message"])}
        if offset is not None:
            params["offset"] = offset

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.get(f"{TELEGRAM_API_BASE}/bot{settings.telegram_bot_token}/getUpdates", params=params)
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPError as exc:
            return {"status": "failed", "reason": str(exc)[:240], "processed": 0}

        updates = payload.get("result", [])
        processed = 0
        for update in updates:
            update_id = int(update.get("update_id", 0))
            await redis.set("telegram:commands:last_update_id", str(update_id))
            if await self._handle_update(update):
                processed += 1

        return {"status": "ok", "updates": len(updates), "processed": processed}

    async def _handle_update(self, update: dict[str, Any]) -> bool:
        message = update.get("message") or {}
        text = str(message.get("text") or "").strip()
        chat = message.get("chat") or {}
        chat_id = str(chat.get("id") or "")
        has_photo = bool(message.get("photo"))
        if (not text and not has_photo) or not chat_id:
            return False
        if settings.telegram_chat_id and chat_id != str(settings.telegram_chat_id):
            return False

        # Avoid replying to stale messages when polling is enabled for the first time.
        message_date = int(message.get("date") or 0)
        if message_date and datetime.now(UTC).timestamp() - message_date > 10 * 60:
            return False

        if message.get("photo"):
            reply = await self.photo_chart_reply(message)
            await send_telegram_message(reply, chat_id=chat_id, bot_token=settings.telegram_bot_token)
            return True

        reply = await self.build_reply(text)
        await send_telegram_message(reply, chat_id=chat_id, bot_token=settings.telegram_bot_token)
        return True

    async def build_reply(self, text: str) -> str:
        command, argument = parse_command(text)
        if command == "help":
            return HELP_TEXT
        if command == "market":
            return await self.market_reply()
        if command == "signal":
            return await self.latest_signal_reply()
        if command == "ask":
            if not argument:
                return "Send /ask followed by your question. Example: /ask Is BTC overextended?"
            return await self.ai_reply(argument)
        if command == "price":
            if not argument:
                return "Send /price BTC, /price ETHUSDT, /price GOLD, or /price OIL."
            return await self.price_reply(argument)

        if looks_like_symbol_query(text):
            return await self.price_reply(text)
        return await self.ai_reply(text)

    async def ai_reply(self, text: str) -> str:
        try:
            response = await self.ai_service.chat(
                message=(
                    "You are Vypexrock AI inside Telegram. Answer like a calm professional trader and AI market assistant. "
                    "Be concise, risk-aware, and never promise profits. If the user asks trading advice, explain scenarios, invalidation, and risk.\n\n"
                    f"User: {text}"
                ),
                mode="short",
            )
            return trim_telegram_reply(response.answer)
        except Exception:
            return (
                "Vypexrock AI is temporarily unavailable.\n\n"
                "I can still answer price commands like BTC, /price ETH, /market, and /signal."
            )

    async def photo_chart_reply(self, message: dict[str, Any]) -> str:
        photos = message.get("photo") or []
        if not photos:
            return "I could not read the chart image. Send a clear screenshot or use /ask with chart context."
        largest = max(photos, key=lambda item: int(item.get("file_size") or 0))
        file_id = str(largest.get("file_id") or "")
        caption = str(message.get("caption") or "").strip()
        if not file_id:
            return "I could not read the chart image. Send a clear screenshot or use /ask with chart context."
        try:
            image_bytes, mime_type = await self.download_telegram_file(file_id)
            response = await self.ai_service.chat_with_image(
                (
                    "Analyze this trading chart screenshot like a professional trader. "
                    "Return market bias, key levels, liquidity, entry plan, stop loss, take profits, invalidation, and no-trade warning if weak. "
                    f"User caption/context: {caption or 'none'}"
                ),
                image_bytes,
                mime_type=mime_type,
            )
            return trim_telegram_reply(response.answer)
        except Exception:
            return "I received the chart image, but image analysis failed right now. Try again or send /ask with symbol, timeframe, and visible levels."

    async def download_telegram_file(self, file_id: str) -> tuple[bytes, str]:
        async with httpx.AsyncClient(timeout=30) as client:
            file_response = await client.get(f"{TELEGRAM_API_BASE}/bot{settings.telegram_bot_token}/getFile", params={"file_id": file_id})
            file_response.raise_for_status()
            file_payload = file_response.json()
            file_path = (file_payload.get("result") or {}).get("file_path")
            if not file_path:
                raise ValueError("telegram file_path missing")
            download_response = await client.get(f"{TELEGRAM_API_BASE}/file/bot{settings.telegram_bot_token}/{file_path}")
            download_response.raise_for_status()
            mime_type = "image/png" if str(file_path).lower().endswith(".png") else "image/jpeg"
            return download_response.content, mime_type

    async def price_reply(self, raw_symbol: str) -> str:
        symbol = normalize_symbol(raw_symbol)
        if not symbol:
            return unknown_asset_message()

        ticker = await self.safe_fetch_live_ticker(symbol)
        if not ticker:
            ticker = await self.safe_fetch_yahoo_fallback(raw_symbol, symbol)
        if not ticker:
            return unknown_asset_message()

        now = datetime.now(UTC)
        price = float(ticker.get("price", 0))
        change = float(ticker.get("change_24h", 0))
        volume = float(ticker.get("volume_24h", 0))
        mood = market_mood(change)
        return "\n".join(
            [
                f"{ticker['symbol']} Live Update",
                f"Price: {format_price(price)}",
                f"24H Change: {change:+.2f}%",
                f"24H Volume: {format_compact(volume)}",
                f"Market Mood: {mood}",
                f"Time: {now.strftime('%H:%M:%S')} UTC",
            ]
        )

    async def market_reply(self) -> str:
        rows = await self.market_service.fetch_rest_tickers(market_update_symbols())
        for metal_symbol in settings.tracked_metals:
            metal = await self.market_service.fetch_metal_ticker(metal_symbol, use_cache=False)
            if metal:
                rows.append(metal)
        top_rows = top_market_rows(rows, settings.telegram_market_top_assets_count)
        now = datetime.now(UTC)
        lines = [
            "Vypexrock Market Pulse",
            f"{now.strftime('%Y-%m-%d %H:%M')} UTC",
            "",
        ]
        for index, row in enumerate(top_rows, start=1):
            lines.append(f"{index}. {row['symbol']} - {format_price(float(row['price']))} | {float(row.get('change_24h', 0)):+.2f}%")
        return "\n".join(lines)

    async def latest_signal_reply(self) -> str:
        redis = await get_redis()
        active = await redis.hgetall("telegram_active_signals")
        if active:
            latest = sorted((json.loads(value) for value in active.values()), key=lambda item: item.get("sentAt", ""), reverse=True)[0]
            return format_latest_signal(latest, active=True)

        history = await redis.lrange("telegram_signal_history", 0, 0)
        if history:
            return format_latest_signal(json.loads(history[0]), active=False)

        return "No recent best setup is available. Vypexrock is waiting for a cleaner 4H setup with 1H confirmation."

    async def fetch_live_ticker(self, symbol: str) -> dict | None:
        if symbol == "XAUUSD":
            return await self.market_service.fetch_metal_ticker("XAUUSD", use_cache=False)
        if symbol in {"USOIL", "UKOIL"}:
            return await self.market_service.fetch_oil_ticker(symbol)
        rows = await self.market_service.fetch_rest_tickers([symbol])
        return rows[0] if rows else None

    async def safe_fetch_live_ticker(self, symbol: str) -> dict | None:
        try:
            return await self.fetch_live_ticker(symbol)
        except Exception:
            return None

    async def safe_fetch_yahoo_fallback(self, raw_symbol: str, normalized_symbol: str) -> dict | None:
        try:
            yahoo_symbol, output_symbol, name = yahoo_lookup_symbol(raw_symbol, normalized_symbol)
            if not yahoo_symbol:
                return None
            return await self.market_service.fetch_yahoo_chart_ticker(yahoo_symbol, output_symbol, name)
        except Exception:
            return None


def parse_command(text: str) -> tuple[str | None, str]:
    cleaned = text.strip()
    if not cleaned.startswith("/"):
        return None, cleaned
    parts = cleaned.split(maxsplit=1)
    command = parts[0].split("@", maxsplit=1)[0].lstrip("/").lower()
    argument = parts[1].strip() if len(parts) > 1 else ""
    return command, argument


def normalize_symbol(raw_symbol: str) -> str | None:
    symbol = re.sub(r"[^A-Za-z0-9]", "", raw_symbol).upper()
    if not symbol:
        return None
    if symbol in SYMBOL_ALIASES:
        return SYMBOL_ALIASES[symbol]
    if symbol in settings.tracked_symbols or symbol.endswith("USDT"):
        return symbol
    if 2 <= len(symbol) <= 8:
        return f"{symbol}USDT"
    return None


def looks_like_symbol_query(text: str) -> bool:
    cleaned = clean_symbol(text)
    if not cleaned:
        return False
    if " " in text.strip():
        return False
    if cleaned in SYMBOL_ALIASES or cleaned in YAHOO_SYMBOL_ALIASES:
        return True
    if cleaned.endswith("USDT") and 5 <= len(cleaned) <= 16:
        return True
    return 2 <= len(cleaned) <= 8 and cleaned.isalnum()


def clean_symbol(raw_symbol: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", raw_symbol).upper()


def yahoo_lookup_symbol(raw_symbol: str, normalized_symbol: str) -> tuple[str | None, str, str]:
    raw = clean_symbol(raw_symbol)
    if raw in YAHOO_SYMBOL_ALIASES:
        return YAHOO_SYMBOL_ALIASES[raw]
    if normalized_symbol.endswith("USDT"):
        base = normalized_symbol.removesuffix("USDT")
        if 2 <= len(base) <= 8:
            return f"{base}-USD", normalized_symbol, f"{base} / USD"
    if raw.endswith("USD") and len(raw) == 6:
        return f"{raw}=X", raw, f"{raw[:3]} / {raw[3:]}"
    if 1 <= len(raw) <= 6 and raw.isalnum():
        return raw, raw, raw
    return None, raw, raw


def unknown_asset_message() -> str:
    return "Asset not found. Try BTC, ETH, SOL, PEPE, INJ, GOLD, or OIL."


def trim_telegram_reply(answer: str, limit: int = 1400) -> str:
    clean = answer.strip()
    if len(clean) <= limit:
        return clean
    return clean[: limit - 3].rstrip() + "..."


def market_mood(change_24h: float) -> str:
    if change_24h >= 0.75:
        return "Constructive"
    if change_24h <= -0.75:
        return "Defensive"
    return "Neutral"


def format_latest_signal(signal: dict[str, Any], *, active: bool) -> str:
    tps = signal.get("take_profits") or []
    status = "Active" if active else "Latest"
    lines = [
        f"{status} Vypexrock Setup",
        f"{signal.get('symbol', 'UNKNOWN')} | {signal.get('timeframe', '4H')} + {signal.get('confirmation_timeframe', '1H')}",
        f"Direction: {signal.get('direction', 'UNKNOWN')}",
        f"Confidence: {signal.get('confidence', 0)}% | R:R: {float(signal.get('risk_reward', 0)):.2f}R",
        f"Entry Zone: {format_price(float(signal.get('entry_low', signal.get('entry', 0))))} - {format_price(float(signal.get('entry_high', signal.get('entry', 0))))}",
        f"SL: {format_price(float(signal.get('stop_loss', 0)))}",
    ]
    for index, target in enumerate(tps[:3], start=1):
        lines.append(f"TP{index}: {format_price(float(target))}")
    lines.append("Probability-based setup, not financial advice.")
    return "\n".join(lines)


def format_price(value: float) -> str:
    if value >= 1000:
        return f"${value:,.2f}"
    if value >= 1:
        return f"${value:,.4f}"
    return f"${value:,.8f}".rstrip("0").rstrip(".")


def format_compact(value: float) -> str:
    absolute = abs(value)
    if absolute >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B"
    if absolute >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    if absolute >= 1_000:
        return f"${value / 1_000:.2f}K"
    return f"${value:,.0f}"
