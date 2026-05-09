from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.subscription import Plan


async def seed_plans() -> None:
    async with AsyncSessionLocal() as db:
        for payload in [
            {
                "code": settings.free_plan_code,
                "name": "Free",
                "description": "Core dashboard, watchlist, and limited alerts",
                "max_watchlist_items": 10,
                "ai_explanations_enabled": False,
                "telegram_alerts_enabled": False,
            },
            {
                "code": settings.premium_plan_code,
                "name": "Pro",
                "description": "Expanded alerts, Telegram delivery, and AI explanations",
                "max_watchlist_items": 100,
                "ai_explanations_enabled": True,
                "telegram_alerts_enabled": True,
            },
        ]:
            existing = await db.scalar(select(Plan).where(Plan.code == payload["code"]))
            if not existing:
                db.add(Plan(**payload))
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed_plans())
