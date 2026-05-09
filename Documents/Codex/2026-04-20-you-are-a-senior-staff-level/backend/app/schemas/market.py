from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import Timestamped


class MarketTicker(BaseModel):
    symbol: str
    price: float
    change_24h: float
    volume_24h: float
    metadata_name: str | None = None
    metadata_image: str | None = None


class SignalRead(Timestamped):
    id: int
    symbol: str
    timeframe: str
    bias: str
    confidence: int
    entry_low: float
    entry_high: float
    stop_loss: float
    take_profit_1: float
    take_profit_2: float
    take_profit_3: float
    rsi: float
    ema20: float
    ema50: float
    macd: float
    macd_signal: float
    structure_state: str
    explanation: str
    suggested_risk_note: str


class Candle(BaseModel):
    open_time: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class CoinDetail(BaseModel):
    symbol: str
    ticker: MarketTicker
    candles: list[Candle]
    signals: list[SignalRead]
