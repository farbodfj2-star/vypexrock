from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.telegram import TelegramAccountRead, TelegramAutomationSettingsRead, TelegramLinkRequest, TelegramTestResponse
from app.services.signal_alert_service import SignalAlertAutomationService, market_update_symbols, signal_symbols
from app.services.telegram_service import send_telegram_message
from app.services.telegram_service import TelegramService

router = APIRouter()


@router.get("", response_model=TelegramAccountRead | None)
async def get_telegram_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TelegramAccountRead | None:
    account = await TelegramService(db).get_for_user(current_user.id)
    return TelegramAccountRead.model_validate(account) if account else None


@router.post("/link", response_model=TelegramAccountRead, status_code=status.HTTP_201_CREATED)
async def link_telegram(
    payload: TelegramLinkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TelegramAccountRead:
    account = await TelegramService(db).upsert(current_user.id, payload)
    return TelegramAccountRead.model_validate(account)


@router.get("/settings", response_model=TelegramAutomationSettingsRead)
async def get_telegram_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TelegramAutomationSettingsRead:
    account = await TelegramService(db).get_for_user(current_user.id)
    logs = await SignalAlertAutomationService().read_delivery_logs()
    last_market_update = first_log_time(logs, {"market_pulse"})
    last_best_setup = first_log_time(logs, {"best_setup"})
    return TelegramAutomationSettingsRead(
        bot_configured=bool(settings.telegram_bot_token or account and account.bot_token),
        env_bot_configured=bool(settings.telegram_bot_token),
        user_bot_configured=bool(account and account.bot_token),
        env_chat_configured=bool(settings.telegram_chat_id),
        linked_chat_configured=bool(account),
        enabled=settings.telegram_signal_enabled,
        signal_alerts_enabled=settings.telegram_signal_enabled,
        market_update_enabled=settings.telegram_market_update_enabled,
        interval_minutes=settings.telegram_update_interval_minutes,
        market_update_interval_minutes=settings.telegram_market_update_interval_minutes,
        signal_interval_minutes=settings.telegram_signal_interval_minutes,
        top_assets_count=settings.telegram_market_top_assets_count,
        min_confidence=settings.telegram_signal_min_confidence,
        min_risk_reward=settings.telegram_signal_min_risk_reward,
        cooldown_minutes=settings.telegram_signal_cooldown_minutes,
        check_interval_seconds=settings.telegram_signal_check_seconds,
        timeframe=settings.telegram_signal_timeframe.upper(),
        symbols=signal_symbols(),
        market_symbols=market_update_symbols(),
        last_sent_at=logs[0].get("sent_at") if logs else None,
        last_market_update_sent_at=last_market_update,
        last_best_setup_sent_at=last_best_setup,
        market_message_preview=market_message_preview(),
        best_setup_message_preview=best_setup_message_preview(),
        recent_logs=logs,
    )


@router.post("/test", response_model=TelegramTestResponse)
async def test_telegram_message(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TelegramTestResponse:
    account = await TelegramService(db).get_for_user(current_user.id)
    chat_id = account.chat_id if account else settings.telegram_chat_id
    bot_token = account.bot_token if account and account.bot_token else settings.telegram_bot_token
    if not bot_token:
        raise HTTPException(status_code=400, detail="Add your Telegram Bot Token or set TELEGRAM_BOT_TOKEN.")
    if not chat_id:
        raise HTTPException(status_code=400, detail="Link a Telegram chat ID or set TELEGRAM_CHAT_ID.")

    delivery = await send_telegram_message(
        "Vypexrock Telegram test message.\n\nSignal automation is connected. Medium/high confidence alerts include entry, stop, targets, confidence, R:R, chart image, and a risk warning.",
        chat_id=chat_id,
        bot_token=bot_token,
    )
    return TelegramTestResponse(status=str(delivery.get("status")), detail="Test message requested.", delivery=delivery)


@router.post("/test-signal", response_model=TelegramTestResponse)
async def test_telegram_signal(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TelegramTestResponse:
    account = await TelegramService(db).get_for_user(current_user.id)
    chat_id = account.chat_id if account else settings.telegram_chat_id
    bot_token = account.bot_token if account and account.bot_token else settings.telegram_bot_token
    if not bot_token:
        raise HTTPException(status_code=400, detail="Add your Telegram Bot Token or set TELEGRAM_BOT_TOKEN.")
    if not chat_id:
        raise HTTPException(status_code=400, detail="Link a Telegram chat ID or set TELEGRAM_CHAT_ID.")

    result = await SignalAlertAutomationService().send_best_setup_signal(force=True, chat_id=chat_id, bot_token=bot_token)
    return TelegramTestResponse(status=str(result.get("status")), detail="Best setup scan requested.", delivery=result)


@router.post("/test-market-report", response_model=TelegramTestResponse)
async def test_telegram_market_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TelegramTestResponse:
    account = await TelegramService(db).get_for_user(current_user.id)
    chat_id = account.chat_id if account else settings.telegram_chat_id
    bot_token = account.bot_token if account and account.bot_token else settings.telegram_bot_token
    if not bot_token:
        raise HTTPException(status_code=400, detail="Add your Telegram Bot Token or set TELEGRAM_BOT_TOKEN.")
    if not chat_id:
        raise HTTPException(status_code=400, detail="Link a Telegram chat ID or set TELEGRAM_CHAT_ID.")

    result = await SignalAlertAutomationService().send_hourly_market_update(
        force=True,
        chat_id=chat_id,
        bot_token=bot_token,
    )
    return TelegramTestResponse(status=str(result.get("status")), detail="Hourly market update requested.", delivery=result)


@router.post("/test-best-setup", response_model=TelegramTestResponse)
async def test_telegram_best_setup(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TelegramTestResponse:
    account = await TelegramService(db).get_for_user(current_user.id)
    chat_id = account.chat_id if account else settings.telegram_chat_id
    bot_token = account.bot_token if account and account.bot_token else settings.telegram_bot_token
    if not bot_token:
        raise HTTPException(status_code=400, detail="Add your Telegram Bot Token or set TELEGRAM_BOT_TOKEN.")
    if not chat_id:
        raise HTTPException(status_code=400, detail="Link a Telegram chat ID or set TELEGRAM_CHAT_ID.")

    result = await SignalAlertAutomationService().send_best_setup_signal(force=True, chat_id=chat_id, bot_token=bot_token)
    return TelegramTestResponse(status=str(result.get("status")), detail="Best setup scan requested.", delivery=result)


def first_log_time(logs: list[dict], kinds: set[str]) -> str | None:
    for log in logs:
        if log.get("type") in kinds:
            return log.get("sent_at")
    return None


def market_message_preview() -> str:
    return "\n".join(
        [
            "📊 Vypexrock Hourly Market Pulse",
            "🕒 2026-04-26 | 17:00 UTC",
            "",
            "🔥 Top 15 Live Assets",
            "",
            "1. BTCUSDT — $78,013 | +0.78%",
            "2. ETHUSDT — $2,345 | +1.54%",
            "3. SOLUSDT — $86.48 | +0.66%",
            "",
            "Market mood: Neutral, waiting for confirmation.",
            "",
            "⚠️ Probability-based data, not financial advice.",
        ]
    )


def best_setup_message_preview() -> str:
    return "\n".join(
        [
            "⚠️ Medium Confidence Setup",
            "",
            "Asset: BTCUSDT",
            "Timeframe: 4H",
            "Direction: LONG",
            "Confidence: 62%",
            "Risk/Reward: 1.80R",
            "",
            "Live Price: $78,013",
            "Entry Trigger: $78,450",
            "Stop Loss: $77,200",
            "TP1: $79,300",
            "TP2: $80,100",
            "TP3: $81,000",
            "",
            "Reason:",
            "Bullish 4H structure with breakout confirmation.",
            "",
            "Invalidation:",
            "Invalid below $77,200.",
            "",
            "⚠️ Not financial advice. Use risk management.",
        ]
    )
