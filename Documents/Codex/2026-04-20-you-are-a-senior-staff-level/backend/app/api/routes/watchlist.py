from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.watchlist import WatchlistCreate, WatchlistRead
from app.services.watchlist_service import WatchlistService

router = APIRouter()


@router.get("", response_model=list[WatchlistRead])
async def list_watchlist(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[WatchlistRead]:
    items = await WatchlistService(db).list_for_user(current_user.id)
    return [WatchlistRead.model_validate(item) for item in items]


@router.post("", response_model=WatchlistRead, status_code=status.HTTP_201_CREATED)
async def add_watchlist(
    payload: WatchlistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> WatchlistRead:
    item = await WatchlistService(db).add(current_user.id, payload.symbol)
    return WatchlistRead.model_validate(item)


@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_watchlist(
    symbol: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    await WatchlistService(db).remove(current_user.id, symbol)
