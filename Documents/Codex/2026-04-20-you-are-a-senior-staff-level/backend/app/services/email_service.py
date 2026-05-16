from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def is_email_configured() -> bool:
    """Check if SMTP is properly configured."""
    return bool(settings.smtp_host and settings.smtp_username and settings.smtp_password)


async def send_email(to_email: str, subject: str, body: str, html_body: str | None = None) -> bool:
    """Send an email using SMTP."""
    if not is_email_configured():
        logger.info("SMTP not configured; email would be sent to %s with subject: %s", to_email, subject)
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = to_email
    message.set_content(body)
    
    if html_body:
        message.add_alternative(html_body, subtype="html")

    def _send() -> None:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)

    try:
        await asyncio.to_thread(_send)
        logger.info("Email sent successfully to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False


async def send_verification_email(email: str, code: str) -> bool:
    """Send email verification code."""
    subject = "Verify your Vypexrock account"
    body = f"""
Welcome to Vypexrock!

Your email verification code is:

{code}

This code expires in {settings.email_verification_expire_minutes} minutes.

If you didn't create a Vypexrock account, you can safely ignore this email.

Best regards,
The Vypexrock Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #22d3ee, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }}
        .header h1 {{ color: white; margin: 0; font-size: 24px; }}
        .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }}
        .code {{ background: white; border: 2px solid #22d3ee; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8b5cf6; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Welcome to Vypexrock</h1>
        </div>
        <div class="content">
            <p>Thank you for creating your Vypexrock account!</p>
            <p>Your email verification code is:</p>
            <div class="code">{code}</div>
            <p>This code expires in {settings.email_verification_expire_minutes} minutes.</p>
            <p>If you didn't create a Vypexrock account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The Vypexrock Team</p>
        </div>
    </div>
</body>
</html>
"""
    
    return await send_email(email, subject, body, html_body)


async def send_password_reset_email(email: str, code: str) -> bool:
    """Send password reset code."""
    subject = "Reset your Vypexrock password"
    body = f"""
You requested to reset your Vypexrock password.

Your password reset code is:

{code}

This code expires in {settings.password_reset_expire_minutes} minutes.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The Vypexrock Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ef4444, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }}
        .header h1 {{ color: white; margin: 0; font-size: 24px; }}
        .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }}
        .code {{ background: white; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8b5cf6; margin: 20px 0; }}
        .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <p>You requested to reset your Vypexrock password.</p>
            <p>Your password reset code is:</p>
            <div class="code">{code}</div>
            <p>This code expires in {settings.password_reset_expire_minutes} minutes.</p>
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
            </div>
        </div>
        <div class="footer">
            <p>Best regards,<br>The Vypexrock Team</p>
        </div>
    </div>
</body>
</html>
"""
    
    return await send_email(email, subject, body, html_body)


# Legacy function for backward compatibility
async def send_password_reset_code(email: str, code: str) -> bool:
    """Legacy function - redirects to send_password_reset_email."""
    return await send_password_reset_email(email, code)

