from sqlalchemy import DateTime, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Signal(TimestampMixin, Base):
    __tablename__ = "signals"
    __table_args__ = (UniqueConstraint("symbol", "timeframe", name="uq_signals_symbol_timeframe"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    symbol: Mapped[str] = mapped_column(String(24), index=True)
    timeframe: Mapped[str] = mapped_column(String(8), index=True)
    bias: Mapped[str] = mapped_column(String(16), index=True)
    confidence: Mapped[int] = mapped_column(Integer)
    entry_low: Mapped[float] = mapped_column(Numeric(18, 8))
    entry_high: Mapped[float] = mapped_column(Numeric(18, 8))
    stop_loss: Mapped[float] = mapped_column(Numeric(18, 8))
    take_profit_1: Mapped[float] = mapped_column(Numeric(18, 8))
    take_profit_2: Mapped[float] = mapped_column(Numeric(18, 8))
    take_profit_3: Mapped[float] = mapped_column(Numeric(18, 8))
    rsi: Mapped[float] = mapped_column(Numeric(10, 4))
    ema20: Mapped[float] = mapped_column(Numeric(18, 8))
    ema50: Mapped[float] = mapped_column(Numeric(18, 8))
    macd: Mapped[float] = mapped_column(Numeric(18, 8))
    macd_signal: Mapped[float] = mapped_column(Numeric(18, 8))
    structure_state: Mapped[str] = mapped_column(String(32))
    explanation: Mapped[str] = mapped_column(Text)
    suggested_risk_note: Mapped[str] = mapped_column(Text)
