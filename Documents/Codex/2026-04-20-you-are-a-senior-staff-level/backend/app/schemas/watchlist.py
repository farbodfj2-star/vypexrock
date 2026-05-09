from pydantic import BaseModel, Field

from app.schemas.common import Timestamped


class WatchlistCreate(BaseModel):
    symbol: str = Field(min_length=3, max_length=24)


class WatchlistRead(Timestamped):
    id: int
    symbol: str
    base_asset: str | None
    quote_asset: str | None
