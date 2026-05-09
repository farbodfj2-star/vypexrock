import logging

from celery import Celery

from app.core.config import settings

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

celery_app = Celery("crypto_platform", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_default_queue="default",
    task_routes={
        "app.tasks.analysis.refresh_signals": {"queue": "analysis"},
        "app.tasks.alerts.scan_alerts": {"queue": "alerts"},
        "app.tasks.telegram.send_telegram_message": {"queue": "telegram"},
        "app.tasks.telegram.send_telegram_photo": {"queue": "telegram"},
        "app.tasks.telegram.poll_telegram_commands": {"queue": "telegram"},
        "app.tasks.signal_alerts.scan_high_confidence_signals": {"queue": "telegram"},
        "app.tasks.signal_alerts.send_market_report_and_signals": {"queue": "telegram"},
        "app.tasks.signal_alerts.send_hourly_market_update": {"queue": "telegram"},
        "app.tasks.signal_alerts.send_best_setup_signal": {"queue": "telegram"},
        "app.tasks.signal_alerts.track_open_telegram_signals": {"queue": "telegram"},
    },
    beat_schedule={
        "refresh-signals": {
            "task": "app.tasks.analysis.refresh_signals",
            "schedule": settings.signal_refresh_seconds,
        },
        "scan-alerts": {
            "task": "app.tasks.alerts.scan_alerts",
            "schedule": settings.alert_refresh_seconds,
        },
        "send-telegram-hourly-market-pulse": {
            "task": "app.tasks.signal_alerts.send_hourly_market_update",
            "schedule": settings.telegram_market_update_interval_minutes * 60,
        },
        "send-telegram-best-setup": {
            "task": "app.tasks.signal_alerts.send_best_setup_signal",
            "schedule": settings.telegram_signal_interval_minutes * 60,
        },
        "track-open-telegram-signals": {
            "task": "app.tasks.signal_alerts.track_open_telegram_signals",
            "schedule": settings.telegram_tracking_interval_minutes * 60,
        },
        "poll-telegram-chat-commands": {
            "task": "app.tasks.telegram.poll_telegram_commands",
            "schedule": settings.telegram_command_poll_seconds,
        },
    },
    timezone="UTC",
    imports=(
        "app.tasks.analysis",
        "app.tasks.alerts",
        "app.tasks.signal_alerts",
        "app.tasks.telegram",
    ),
)
