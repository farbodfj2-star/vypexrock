from pydantic import BaseModel, Field


class ChartAnalysisRequest(BaseModel):
    symbol: str
    timeframe: str = "30m"
    strategy: str = "Smart Money Concepts"
    indicators: list[str] = Field(default_factory=list)
    prompt: str | None = None


class PriceRange(BaseModel):
    low: float
    high: float


class ChartAnalysisResponse(BaseModel):
    symbol: str
    timeframe: str
    strategy: str
    decision: str
    bias: str
    confidence: int
    entryZone: PriceRange
    stopLoss: float
    takeProfits: tuple[float, float, float]
    supportLevels: tuple[float, float]
    resistanceLevels: tuple[float, float]
    invalidationLevel: float
    riskReward: str
    indicators: list[str]
    explanation: str
    riskWarning: str
    trendDirection: str
    source: str
    currentPrice: float
    rsi: float
    macd: float
    macdSignal: float
    ema20: float
    ema50: float
