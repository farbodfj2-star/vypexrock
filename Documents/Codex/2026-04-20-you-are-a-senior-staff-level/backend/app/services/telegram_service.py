from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.telegram import TelegramAccount
from app.schemas.telegram import TelegramLinkRequest


TELEGRAM_API_BASE = "https://api.telegram.org"


class TelegramService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert(self, user_id: int, payload: TelegramLinkRequest) -> TelegramAccount:
        result = await self.db.execute(select(TelegramAccount).where(TelegramAccount.user_id == user_id))
        account = result.scalar_one_or_none()
        bot_token = payload.bot_token.strip() if payload.bot_token and payload.bot_token.strip() else None
        if account is None:
            account = TelegramAccount(user_id=user_id, chat_id=payload.chat_id, username=payload.username, bot_token=bot_token)
            self.db.add(account)
        else:
            account.chat_id = payload.chat_id
            account.username = payload.username
            if bot_token:
                account.bot_token = bot_token

        await self.db.commit()
        await self.db.refresh(account)
        return account

    async def get_for_user(self, user_id: int) -> TelegramAccount | None:
        result = await self.db.execute(select(TelegramAccount).where(TelegramAccount.user_id == user_id))
        return result.scalar_one_or_none()


def telegram_is_configured(chat_id: str | None = None, bot_token: str | None = None) -> bool:
    return bool((bot_token or settings.telegram_bot_token) and (chat_id or settings.telegram_chat_id))


async def send_telegram_message(text: str, chat_id: str | None = None, bot_token: str | None = None) -> dict[str, Any]:
    target_chat_id = chat_id or settings.telegram_chat_id
    token = bot_token or settings.telegram_bot_token
    if not token:
        return {"status": "skipped", "reason": "TELEGRAM_BOT_TOKEN is not configured"}
    if not target_chat_id:
        return {"status": "skipped", "reason": "TELEGRAM_CHAT_ID is not configured"}

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                f"{TELEGRAM_API_BASE}/bot{token}/sendMessage",
                json={
                    "chat_id": target_chat_id,
                    "text": text,
                    "disable_web_page_preview": True,
                },
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        return {"status": "failed", "reason": str(exc)[:240], "chat_id": str(target_chat_id)}

    return {
        "status": "sent",
        "message_id": payload.get("result", {}).get("message_id"),
        "chat_id": str(target_chat_id),
    }


async def send_telegram_photo(image_path: str, caption: str, chat_id: str | None = None, bot_token: str | None = None) -> dict[str, Any]:
    target_chat_id = chat_id or settings.telegram_chat_id
    token = bot_token or settings.telegram_bot_token
    if not token:
        return {"status": "skipped", "reason": "TELEGRAM_BOT_TOKEN is not configured"}
    if not target_chat_id:
        return {"status": "skipped", "reason": "TELEGRAM_CHAT_ID is not configured"}

    path = Path(image_path)
    if not path.exists():
        return {"status": "skipped", "reason": f"chart image not found: {image_path}"}

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            with path.open("rb") as image_file:
                response = await client.post(
                    f"{TELEGRAM_API_BASE}/bot{token}/sendPhoto",
                    data={"chat_id": target_chat_id, "caption": caption[:1024]},
                    files={"photo": (path.name, image_file, "image/png")},
                )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        return {"status": "failed", "reason": str(exc)[:240], "chat_id": str(target_chat_id)}

    return {
        "status": "sent",
        "message_id": payload.get("result", {}).get("message_id"),
        "chat_id": str(target_chat_id),
    }


async def send_signal_alert(
    signal: Any,
    screenshot_path: str | None = None,
    chat_id: str | None = None,
    bot_token: str | None = None,
) -> dict[str, Any]:
    message = format_signal_alert(signal)
    if screenshot_path:
        photo_result = await send_telegram_photo(screenshot_path, message, chat_id=chat_id, bot_token=bot_token)
        if photo_result.get("status") == "sent":
            return photo_result
    return await send_telegram_message(message, chat_id=chat_id, bot_token=bot_token)


def format_signal_alert(signal: Any) -> str:
    take_profits = getattr(signal, "take_profits", ())
    tp1 = take_profits[0] if len(take_profits) > 0 else None
    tp2 = take_profits[1] if len(take_profits) > 1 else None
    tp3 = take_profits[2] if len(take_profits) > 2 else None
    reason = getattr(signal, "reason", "Vypexrock detected aligned trend, momentum, and volatility conditions.")
    direction = getattr(signal, "direction", "UNKNOWN")
    current_price = getattr(signal, "current_price", None)
    entry_trigger = getattr(signal, "entry_trigger", getattr(signal, "entry", 0))
    confidence = int(getattr(signal, "confidence", 0))
    symbol = getattr(signal, "symbol", "UNKNOWN")
    timeframe = getattr(signal, "timeframe", "4H")
    volume_ratio = float(getattr(signal, "volume_ratio", 0.0))
    main_reason = getattr(signal, "main_reason", reason)
    confirmation_reason = getattr(signal, "confirmation_reason", "Daily confirmation passed.")
    quality_notes = list(getattr(signal, "quality_notes", ()))
    quality_line = professional_reason(signal, quality_notes, reason)
    trade_direction = "LONG" if "long" in direction.lower() else "SHORT" if "short" in direction.lower() else direction.upper()
    risk_level = signal_risk_level(signal)
    early_entry = current_price if current_price is not None else getattr(signal, "entry", 0)
    signal_type = signal_type_label(confidence)
    header = "\U0001f6a8 VYPEXROCK VALID TRADE SIGNAL"
    if confidence >= settings.telegram_elite_signal_confidence:
        header = "\U0001f48e VYPEXROCK ELITE SETUP"
    elif confidence >= settings.telegram_signal_strong_confidence:
        header = "\U0001f6a8 VYPEXROCK STRONG TRADE SIGNAL"
    elif confidence < settings.telegram_signal_min_confidence:
        header = "\U0001f440 VYPEXROCK EARLY SIGNAL"
    volume_line = "Volume: data unreliable" if volume_ratio <= 0.01 else f"Volume: {volume_ratio:.2f}x relative"
    invalidation = getattr(signal, "invalidation", getattr(signal, "stop_loss", 0))
    main_level = format_signal_price(entry_trigger)
    hot_reason = note_by_priority(
        quality_notes,
        ("volume", "relative volume", "breakout", "breakdown", "BOS", "CHoCH", "liquidity", "Q_Trend", "Supertrend"),
        "hot asset because structure, momentum, and volatility are aligning",
    )
    entry_reason = note_by_priority(
        quality_notes,
        ("EMA", "VWAP", "MACD", "RSI", "support", "resistance", "trend", "structure"),
        quality_line,
    )
    late_warning = move_timing_warning(signal, quality_notes)
    final_decision = final_decision_text(signal_type, main_level)

    return "\n".join(
        [
            header,
            "",
            f"Asset: {friendly_asset_name(symbol)}",
            f"Exchange / Pair: {exchange_pair_label(symbol)}",
            f"Timeframe: {timeframe.upper()}",
            f"Direction: {trade_direction}",
            f"Signal Type: {signal_type}",
            f"Confidence: {confidence}% | Risk: {risk_level}",
            f"Risk/Reward: {float(getattr(signal, 'risk_reward', 0)):.2f}R",
            "",
            f"Live Price: {format_signal_price(current_price)}" if current_price is not None else "Live Price: N/A",
            f"Entry Zone: {entry_zone_text(signal, early_entry)}",
            f"Confirmed Entry: {format_signal_price(entry_trigger)}",
            f"Stop Loss: {format_signal_price(getattr(signal, 'stop_loss', 0))}",
            f"TP1: {format_signal_price(tp1)}" if tp1 is not None else "TP1: N/A",
            f"TP2: {format_signal_price(tp2)}" if tp2 is not None else "TP2: N/A",
            f"TP3: {format_signal_price(tp3)}" if tp3 is not None else "TP3: N/A",
            f"Main Level: {main_level}",
            f"Invalidation: {format_signal_price(invalidation)}",
            "",
            f"Why hot: {clean_note(hot_reason)}.",
            f"Entry reason: {clean_note(entry_reason)}.",
            f"Confirmation: hold trigger and keep invalidation at {format_signal_price(invalidation)}.",
            f"{volume_line}. {late_warning}",
            f"Final Decision: {final_decision}",
            "Probability-based insight. Respect risk.",
        ]
    )


def display_pair(symbol: str) -> str:
    if symbol.endswith("USDT"):
        return f"{symbol[:-4]}/USDT"
    return symbol


def signal_type_label(confidence: int) -> str:
    if confidence >= settings.telegram_elite_signal_confidence:
        return "Elite Setup"
    if confidence >= settings.telegram_signal_strong_confidence:
        return "Strong Trade Signal"
    if confidence >= settings.telegram_signal_min_confidence:
        return "Valid Trade Signal"
    if confidence >= settings.telegram_early_signal_min_confidence:
        return "Early Signal"
    return "Watchlist"


def exchange_pair_label(symbol: str) -> str:
    if symbol.endswith("USDT"):
        return f"Binance Futures / {display_pair(symbol)}"
    return f"External Feed / {display_pair(symbol)}"


def entry_zone_text(signal: Any, fallback: Any) -> str:
    low = getattr(signal, "entry_low", None)
    high = getattr(signal, "entry_high", None)
    if low is not None and high is not None:
        return f"{format_signal_price(low)} - {format_signal_price(high)}"
    return format_signal_price(fallback)


def note_by_priority(notes: list[str], needles: tuple[str, ...], fallback: str) -> str:
    for note in notes:
        if any(needle.lower() in note.lower() for needle in needles):
            return note
    return notes[0] if notes else fallback


def move_timing_warning(signal: Any, notes: list[str]) -> str:
    lowered = " | ".join(notes).lower()
    if "huge impulse" in lowered or "pullback risk" in lowered:
        return "Timing: move may be extended; avoid chasing without pullback."
    if "volume data unreliable" in lowered:
        return "Timing: volume data unreliable; confidence is reduced."
    confidence = int(getattr(signal, "confidence", 0))
    if confidence < settings.telegram_signal_min_confidence:
        return "Timing: early setup; wait for confirmation."
    return "Timing: not late if trigger holds cleanly."


def final_decision_text(signal_type: str, trigger: str) -> str:
    if signal_type == "Early Signal":
        return f"Wait for confirmation at {trigger}."
    if signal_type == "Watchlist":
        return "Wait. No trade until confirmation improves."
    return f"Enter only if price confirms around {trigger}."


def clean_note(note: str) -> str:
    text = str(note).strip()
    text = text[:-1] if text.endswith(".") else text
    return text[:150]


def friendly_asset_name(symbol: str) -> str:
    return {
        "XAUUSD": "GOLD / XAUUSD",
        "XAGUSD": "SILVER / XAGUSD",
        "USOIL": "WTI OIL / USOIL",
        "UKOIL": "BRENT OIL / UKOIL",
        "BTCUSDT": "BTC / BTCUSDT",
        "ETHUSDT": "ETH / ETHUSDT",
        "SOLUSDT": "SOL / SOLUSDT",
        "XRPUSDT": "XRP / XRPUSDT",
        "DOGEUSDT": "DOGE / DOGEUSDT",
    }.get(symbol, display_pair(symbol))


def format_signal_price(value: Any) -> str:
    if value is None:
        return "N/A"
    numeric = float(value)
    if numeric >= 1000:
        return f"${numeric:,.2f}"
    if numeric >= 1:
        return f"${numeric:,.4f}"
    return f"${numeric:,.8f}".rstrip("0").rstrip(".")


def signal_risk_level(signal: Any) -> str:
    confidence = int(getattr(signal, "confidence", 0))
    risk_reward = float(getattr(signal, "risk_reward", 0))
    volume_ratio = float(getattr(signal, "volume_ratio", 0))
    if confidence < settings.telegram_signal_min_confidence:
        return "High"
    if confidence >= settings.telegram_signal_strong_confidence and risk_reward >= 1.8 and volume_ratio >= 0.9:
        return "Low"
    if confidence >= 80 and risk_reward >= 1.4:
        return "Medium"
    return "High"


def professional_reason(signal: Any, quality_notes: list[str], fallback: str) -> str:
    priority_words = (
        "relative volume",
        "volume",
        "EMA",
        "Q_Trend",
        "Supertrend",
        "VWAP",
        "MACD",
        "BOS",
        "CHoCH",
        "liquidity",
        "breakout",
        "breakdown",
        "RSI",
        "trend",
        "structure",
    )
    selected: list[str] = []
    for note in quality_notes:
        if any(word.lower() in note.lower() for word in priority_words) and note not in selected:
            selected.append(note)
        if len(selected) >= 3:
            break
    if not selected:
        selected = quality_notes[:2]
    if not selected:
        return str(fallback).split(".")[0][:220]
    return "; ".join(selected)[:260]
