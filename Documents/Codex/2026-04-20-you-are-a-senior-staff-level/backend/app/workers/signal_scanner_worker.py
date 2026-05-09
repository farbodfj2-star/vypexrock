from __future__ import annotations

import asyncio
import logging

from app.core.config import settings
from app.db.session import close_redis
from app.services.signal_alert_service import SignalAlertAutomationService

logging.basicConfig(level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


async def run_signal_scanner() -> None:
    service = SignalAlertAutomationService()
    interval = max(60, settings.telegram_signal_check_seconds)
    fast_interval = max(30, settings.telegram_signal_fast_check_seconds)
    logger.info(
        "Starting Vypexrock high-conviction scanner: timeframe=%s confirmation=%s min_confidence=%s min_rr=%.2f interval=%ss",
        getattr(settings, "telegram_signal_timeframes", settings.telegram_signal_timeframe).upper(),
        settings.telegram_confirmation_timeframe.upper(),
        settings.telegram_signal_min_confidence,
        settings.telegram_signal_min_risk_reward,
        interval,
    )
    while True:
        scan_result: dict = {"high_volatility": False}
        try:
            scan_result = await service.scan_and_send()
            track_result = await service.track_open_signals()
            logger.info(
                "Scanner cycle complete status=%s checked=%s sent=%s high_volatility=%s tracking=%s followups=%s",
                scan_result.get("status"),
                scan_result.get("checked"),
                scan_result.get("sent"),
                scan_result.get("high_volatility"),
                track_result.get("checked"),
                track_result.get("followups"),
            )
        except Exception:
            logger.exception("High-conviction scanner cycle failed")
        finally:
            await close_redis()
        await asyncio.sleep(fast_interval if scan_result.get("high_volatility") else interval)


def main() -> None:
    asyncio.run(run_signal_scanner())


if __name__ == "__main__":
    main()
