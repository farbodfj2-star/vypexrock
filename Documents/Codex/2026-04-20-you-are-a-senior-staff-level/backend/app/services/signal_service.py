from __future__ import annotations

from dataclasses import asdict, dataclass

from app.services.ai_service import AIExplanationService
from app.services.indicator_service import average_true_range, ema, macd, rsi


@dataclass
class SignalComputation:
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


class SignalEngine:
    def __init__(self):
        self.ai_service = AIExplanationService()

    async def compute(self, candles: list[dict], *, use_ai: bool = True) -> SignalComputation:
        closes = [float(item["close"]) for item in candles]
        ema20_series = ema(closes, 20)
        ema50_series = ema(closes, 50)
        rsi_series = rsi(closes)
        macd_line, signal_line, histogram = macd(closes)

        last_price = closes[-1]
        ema20_value = ema20_series[-1] if ema20_series else last_price
        ema50_value = ema50_series[-1] if ema50_series else last_price
        rsi_value = rsi_series[-1] if rsi_series else 50.0
        macd_value = macd_line[-1] if macd_line else 0.0
        macd_signal_value = signal_line[-1] if signal_line else 0.0
        recent_highs = [float(item["high"]) for item in candles[-20:]]
        recent_lows = [float(item["low"]) for item in candles[-20:]]
        structure_state = "range"
        if last_price >= max(recent_highs[:-1], default=last_price):
            structure_state = "breakout"
        elif last_price <= min(recent_lows[:-1], default=last_price):
            structure_state = "breakdown"

        atr = average_true_range(candles) or (last_price * 0.015)
        momentum_8 = ((last_price - closes[-8]) / closes[-8] * 100) if len(closes) >= 8 and closes[-8] else 0
        momentum_20 = ((last_price - closes[-20]) / closes[-20] * 100) if len(closes) >= 20 and closes[-20] else momentum_8
        ema_spread_pct = ((ema20_value - ema50_value) / last_price * 100) if last_price else 0
        macd_delta = macd_value - macd_signal_value
        macd_norm = (macd_delta / max(atr, last_price * 0.001)) * 8
        rsi_score = 0
        if 52 <= rsi_value <= 68:
            rsi_score = 12
        elif 32 <= rsi_value <= 48:
            rsi_score = -12
        elif rsi_value > 75:
            rsi_score = -6
        elif rsi_value < 25:
            rsi_score = 6

        score = 0.0
        score += max(min(momentum_8 * 7, 24), -24)
        score += max(min(momentum_20 * 4, 22), -22)
        score += max(min(ema_spread_pct * 18, 20), -20)
        score += max(min(macd_norm, 14), -14)
        score += rsi_score
        if structure_state == "breakout":
            score += 14
        elif structure_state == "breakdown":
            score -= 14

        if score >= 16:
            bias = "long"
        elif score <= -16:
            bias = "short"
        else:
            bias = "neutral"

        confidence = int(max(40, min(88, 42 + abs(score) * 0.58)))
        confidence = max(5, min(100, confidence))
        entry_low = round(last_price - (atr * 0.28), 4)
        entry_high = round(last_price + (atr * 0.28), 4)

        if bias == "long":
            stop_loss = round(min(recent_lows[-1], last_price - (atr * 1.3)), 4)
            tp1 = round(last_price + (atr * 1.1), 4)
            tp2 = round(last_price + (atr * 1.9), 4)
            tp3 = round(last_price + (atr * 2.9), 4)
        elif bias == "short":
            stop_loss = round(max(recent_highs[-1], last_price + (atr * 1.3)), 4)
            tp1 = round(last_price - (atr * 1.1), 4)
            tp2 = round(last_price - (atr * 1.9), 4)
            tp3 = round(last_price - (atr * 2.9), 4)
        else:
            stop_loss = round(last_price - (atr * 0.9), 4)
            tp1 = round(last_price + (atr * 0.9), 4)
            tp2 = round(last_price + (atr * 1.35), 4)
            tp3 = round(last_price + (atr * 1.8), 4)

        explanation = (
            f"{bias.title()} bias based on EMA20/EMA50 alignment, RSI at {rsi_value:.1f}, "
            f"and MACD {'bullish' if macd_value > macd_signal_value else 'bearish' if macd_value < macd_signal_value else 'flat'} "
            f"with {structure_state} price structure."
        )
        risk_note = "Suggested levels use recent volatility and should be treated as risk-planning guidance, not guarantees."

        raw = SignalComputation(
            bias=bias,
            confidence=confidence,
            entry_low=entry_low,
            entry_high=entry_high,
            stop_loss=stop_loss,
            take_profit_1=tp1,
            take_profit_2=tp2,
            take_profit_3=tp3,
            rsi=round(rsi_value, 2),
            ema20=round(ema20_value, 4),
            ema50=round(ema50_value, 4),
            macd=round(macd_value, 4),
            macd_signal=round(macd_signal_value, 4),
            structure_state=structure_state,
            explanation=explanation,
            suggested_risk_note=risk_note,
        )
        if use_ai:
            raw.explanation = await self.ai_service.generate_analysis_text(asdict(raw))
        return raw
