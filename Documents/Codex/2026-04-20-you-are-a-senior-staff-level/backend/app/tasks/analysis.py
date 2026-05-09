from __future__ import annotations

import asyncio

from celery import shared_task
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal, close_redis
from app.models.market import Signal
from app.services.market_service import MarketService
from app.services.signal_service import SignalEngine

TIMEFRAMES = ["15m", "1h", "4h", "1d"]


@shared_task(name="app.tasks.analysis.refresh_signals")
def refresh_signals() -> dict[str, int]:
    return asyncio.run(_refresh_signals())


async def _refresh_signals() -> dict[str, int]:
    updated = 0
    try:
        async with AsyncSessionLocal() as db:
            market_service = MarketService(db)
            signal_engine = SignalEngine()
            for symbol in settings.tracked_symbols:
                for timeframe in TIMEFRAMES:
                    candles = await market_service.fetch_candles(symbol, timeframe)
                    if len(candles) < 60:
                        continue
                    computed = await signal_engine.compute(candles)
                    existing = await db.scalar(select(Signal).where(Signal.symbol == symbol, Signal.timeframe == timeframe))
                    if existing is None:
                        existing = Signal(symbol=symbol, timeframe=timeframe, **computed.__dict__)
                        db.add(existing)
                    else:
                        for key, value in computed.__dict__.items():
                            setattr(existing, key, value)
                    updated += 1
            await db.commit()
        return {"updated": updated}
    finally:
        await close_redis()
