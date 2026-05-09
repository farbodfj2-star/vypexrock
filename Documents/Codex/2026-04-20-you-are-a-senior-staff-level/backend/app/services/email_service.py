from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def is_email_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_username and settings.smtp_password)


async def send_password_reset_code(email: str, code: str) -> bool:
    if not is_email_configured():
        logger.info("SMTP is not configured; password reset code will only be available in development logs/UI.")
        return False

    message = EmailMessage()
    message["Subject"] = "Your Vypexrock password reset code"
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = email
    message.set_content(
        "\n".join(
            [
                "Your Vypexrock verification code is:",
                "",
                code,
                "",
                "This code expires in 10 minutes.",
                "If you did not request a password reset, you can ignore this email.",
            ]
        )
    )

    def _send() -> None:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)

    try:
        await asyncio.to_thread(_send)
        return True
    except Exception:
        logger.exception("Failed to send password reset code to %s", email)
        return False
