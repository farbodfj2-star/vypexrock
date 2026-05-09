from __future__ import annotations

import asyncio

from celery import shared_task

from app.db.session import close_redis
from app.services.telegram_command_service import TelegramCommandService
from app.services.telegram_service import send_telegram_message as send_message
from app.services.telegram_service import send_telegram_photo as send_photo


@shared_task(name="app.tasks.telegram.send_telegram_message")
def send_telegram_message(chat_id: str, text: str, bot_token: str | None = None) -> dict[str, str]:
    return asyncio.run(send_message(text, chat_id=chat_id, bot_token=bot_token))


@shared_task(name="app.tasks.telegram.send_telegram_photo")
def send_telegram_photo(chat_id: str, image_path: str, caption: str, bot_token: str | None = None) -> dict[str, str]:
    return asyncio.run(send_photo(image_path, caption, chat_id=chat_id, bot_token=bot_token))


@shared_task(name="app.tasks.telegram.poll_telegram_commands")
def poll_telegram_commands() -> dict:
    return asyncio.run(_poll_telegram_commands())


async def _poll_telegram_commands() -> dict:
    try:
        return await TelegramCommandService().poll_and_handle_updates()
    finally:
        await close_redis()
