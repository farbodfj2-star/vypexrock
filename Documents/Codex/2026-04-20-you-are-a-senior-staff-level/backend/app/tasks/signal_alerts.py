from __future__ import annotations

import asyncio

from celery import shared_task

from app.db.session import close_redis
from app.services.signal_alert_service import SignalAlertAutomationService


@shared_task(name="app.tasks.signal_alerts.scan_high_confidence_signals")
def scan_high_confidence_signals() -> dict:
    return asyncio.run(_scan_high_confidence_signals())


@shared_task(name="app.tasks.signal_alerts.send_market_report_and_signals")
def send_market_report_and_signals() -> dict:
    return asyncio.run(_send_market_report_and_signals())


@shared_task(name="app.tasks.signal_alerts.send_hourly_market_update")
def send_hourly_market_update() -> dict:
    return asyncio.run(_send_hourly_market_update())


@shared_task(name="app.tasks.signal_alerts.send_best_setup_signal")
def send_best_setup_signal() -> dict:
    return asyncio.run(_send_best_setup_signal())


@shared_task(name="app.tasks.signal_alerts.track_open_telegram_signals")
def track_open_telegram_signals() -> dict:
    return asyncio.run(_track_open_telegram_signals())


async def _scan_high_confidence_signals() -> dict:
    try:
        return await SignalAlertAutomationService().scan_and_send()
    finally:
        await close_redis()


async def _send_market_report_and_signals() -> dict:
    try:
        return await SignalAlertAutomationService().send_market_report_and_signals()
    finally:
        await close_redis()


async def _send_hourly_market_update() -> dict:
    try:
        return await SignalAlertAutomationService().send_hourly_market_update()
    finally:
        await close_redis()


async def _send_best_setup_signal() -> dict:
    try:
        return await SignalAlertAutomationService().send_best_setup_signal()
    finally:
        await close_redis()


async def _track_open_telegram_signals() -> dict:
    try:
        return await SignalAlertAutomationService().track_open_signals()
    finally:
        await close_redis()
