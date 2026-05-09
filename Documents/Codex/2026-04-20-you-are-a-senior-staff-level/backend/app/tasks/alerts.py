from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from celery import shared_task
from sqlalchemy import select

from app.db.session import AsyncSessionLocal, close_redis, get_redis
from app.models.alert import Alert, AlertLog
from app.models.market import Signal
from app.models.telegram import TelegramAccount
from app.tasks.telegram import send_telegram_message


@shared_task(name="app.tasks.alerts.scan_alerts")
def scan_alerts() -> dict[str, int]:
    return asyncio.run(_scan_alerts())


async def _scan_alerts() -> dict[str, int]:
    sent = 0
    try:
        redis = await get_redis()
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Alert).where(Alert.is_active.is_(True)))
            alerts = list(result.scalars().all())
            for alert in alerts:
                if alert.last_triggered_at and datetime.now(UTC) - alert.last_triggered_at < timedelta(minutes=alert.cool_down_minutes):
                    continue

                ticker = await redis.hgetall(f"ticker:{alert.symbol}")
                latest_signal = await db.scalar(
                    select(Signal).where(Signal.symbol == alert.symbol, Signal.timeframe == "1h")
                )
                triggered = False
                message = ""

                if alert.condition_type == "price" and ticker:
                    price = Decimal(ticker.get("price", "0"))
                    threshold = Decimal(str(alert.threshold_value or 0))
                    if alert.direction == "above" and price >= threshold:
                        triggered = True
                    if alert.direction == "below" and price <= threshold:
                        triggered = True
                    message = f"*Price alert*\\n{alert.symbol} is {alert.direction} {threshold} at {price}."

                if alert.condition_type == "rsi" and latest_signal:
                    rsi_value = Decimal(str(latest_signal.rsi))
                    threshold = Decimal(str(alert.threshold_value or 0))
                    if alert.direction == "above" and rsi_value >= threshold:
                        triggered = True
                    if alert.direction == "below" and rsi_value <= threshold:
                        triggered = True
                    message = f"*RSI alert*\\n{alert.symbol} RSI is {rsi_value} vs threshold {threshold}."

                if alert.condition_type == "signal_change" and latest_signal:
                    target_bias = alert.direction.lower()
                    if latest_signal.bias == target_bias:
                        triggered = True
                    message = f"*Signal change*\\n{alert.symbol} shifted to {latest_signal.bias} with confidence {latest_signal.confidence}%."

                if not triggered:
                    continue

                log = AlertLog(alert_id=alert.id, user_id=alert.user_id, symbol=alert.symbol, message=message, delivery_status="queued")
                db.add(log)
                account = await db.scalar(select(TelegramAccount).where(TelegramAccount.user_id == alert.user_id))
                if account:
                    send_telegram_message.delay(account.chat_id, message, account.bot_token)
                    log.delivery_status = "sent"
                else:
                    log.delivery_status = "skipped"

                alert.last_triggered_at = datetime.now(UTC)
                sent += 1

            await db.commit()
        return {"triggered": sent}
    finally:
        await close_redis()
