from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.watchlist import Watchlist


class WatchlistService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(self, user_id: int) -> list[Watchlist]:
        result = await self.db.execute(select(Watchlist).where(Watchlist.user_id == user_id).order_by(Watchlist.symbol))
        return list(result.scalars().all())

    async def add(self, user_id: int, symbol: str) -> Watchlist:
        normalized = symbol.upper()
        existing = await self.db.scalar(
            select(Watchlist).where(Watchlist.user_id == user_id, Watchlist.symbol == normalized)
        )
        if existing:
            return existing
        item = Watchlist(
            user_id=user_id,
            symbol=normalized,
            base_asset=normalized[:-4] if normalized.endswith("USDT") else None,
            quote_asset="USDT" if normalized.endswith("USDT") else None,
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def remove(self, user_id: int, symbol: str) -> None:
        await self.db.execute(delete(Watchlist).where(Watchlist.user_id == user_id, Watchlist.symbol == symbol.upper()))
        await self.db.commit()
