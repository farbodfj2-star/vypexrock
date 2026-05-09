from __future__ import annotations

import logging
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models.password_reset import PasswordResetCode
from app.models.user import User

logger = logging.getLogger(__name__)


class PasswordResetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_code(self, user: User) -> str:
        await self.db.execute(
            update(PasswordResetCode)
            .where(PasswordResetCode.user_id == user.id, PasswordResetCode.consumed.is_(False))
            .values(consumed=True)
        )
        code = f"{secrets.randbelow(1_000_000):06d}"
        reset = PasswordResetCode(
            user_id=user.id,
            code_hash=get_password_hash(code),
            expires_at=datetime.now(UTC) + timedelta(minutes=10),
        )
        self.db.add(reset)
        await self.db.commit()
        logger.info("Password reset code for %s: %s", user.email, code)
        return code

    async def reset_password(self, user: User, code: str, new_password: str) -> bool:
        result = await self.db.execute(
            select(PasswordResetCode)
            .where(
                PasswordResetCode.user_id == user.id,
                PasswordResetCode.consumed.is_(False),
                PasswordResetCode.expires_at > datetime.now(UTC),
            )
            .order_by(PasswordResetCode.created_at.desc())
        )
        candidates = list(result.scalars().all())
        for candidate in candidates:
            if verify_password(code, candidate.code_hash):
                user.hashed_password = get_password_hash(new_password)
                candidate.consumed = True
                await self.db.commit()
                return True
        return False


def should_return_dev_code() -> bool:
    return settings.environment.lower() in {"development", "dev", "local"}
