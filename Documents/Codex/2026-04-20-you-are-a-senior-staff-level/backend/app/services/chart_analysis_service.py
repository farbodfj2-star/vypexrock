from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.chart_analysis import ChartAnalysisRequest, ChartAnalysisResponse, PriceRange
from app.services.market_service import MarketService
from app.services.signal_alert_service import average_true_range_local
from app.services.signal_alert_service import confirmation_check
from app.services.signal_alert_service import ema_local
from app.services.signal_alert_service import has_level_conflict
from app.services.signal_alert_service import looks_like_fake_breakout
from app.services.signal_alert_service import market_structure
from app.services.signal_alert_service import recent_volume_ratio
from app.services.signal_alert_service import rsi_local
from app.services.signal_alert_service import swing_points
from app.services.signal_alert_service import trend_bias
from app.core.config import settings
from app.services.chart_workstation_service import ChartWorkstationService, WorkstationSetup, structure_annotations
from app.services.signal_service import SignalEngine

AnalysisBias = Literal["long", "short", "neutral"]


@dataclass(frozen=True)
class TimeframeContext:
    timeframe: str
    bias: AnalysisBias
    trend: str
    structure: str
    rsi: float
    ema20: float
    ema50: float
    atr: float
    volume_ratio: float
    close: float
    recent_high: float
    recent_low: float
    breakout: bool
    breakdown: bool
    liquidity_sweep: bool
    rejection: str | None
    huge_impulse: bool
    distance_from_ema20_atr: float


@dataclass(frozen=True)
class ProfessionalAnalysis:
    decision: str
    bias: AnalysisBias
    confidence: int
    entry_low: float
    entry_high: float
    stop_loss: float
    take_profits: tuple[float, float, float]
    support_levels: tuple[float, float]
    resistance_levels: tuple[float, float]
    invalidation: float
    risk_reward: float
    explanation: str
    notes: tuple[str, ...]
    trend_direction: str


class ChartAnalysisService:
    def __init__(self, db: AsyncSession | None = None):
        self.market_service = MarketService(db)
        self.signal_engine = SignalEngine()

    async def analyze(self, payload: ChartAnalysisRequest) -> ChartAnalysisResponse:
        symbol = payload.symbol.upper().replace("-", "")

        candles_by_tf = {
            "4h": await self.market_service.fetch_candles(symbol, "4h", limit=220),
            "1h": await self.market_service.fetch_candles(symbol, "1h", limit=220),
            "30m": await self.market_service.fetch_candles(symbol, "30m", limit=220),
            "15m": await self.market_service.fetch_candles(symbol, "15m", limit=220),
        }
        missing = [timeframe for timeframe, candles in candles_by_tf.items() if len(candles) < 80]
        if missing:
            raise ValueError(f"Not enough candle data for {symbol}: {', '.join(missing)}")

        main_signal = await self.signal_engine.compute(candles_by_tf["4h"], use_ai=False)
        contexts = {timeframe: build_timeframe_context(timeframe, candles) for timeframe, candles in candles_by_tf.items()}
        analysis = build_professional_analysis(
            symbol=symbol,
            strategy=payload.strategy,
            prompt=payload.prompt,
            main_signal=main_signal,
            contexts=contexts,
            candles_by_tf=candles_by_tf,
        )

        chart_urls = ("", "")
        structure_label, bos, choch, sweep = structure_annotations(candles_by_tf[payload.timeframe.lower()] or candles_by_tf["15m"])
        alignment = (
            f"4H {contexts['4h'].structure} · 1H {contexts['1h'].structure} · "
            f"15m {contexts['15m'].structure} · entry {contexts['15m'].bias}"
        )
        try:
            renderer = ChartWorkstationService(output_dir=settings.chart_media_dir)
            setup = WorkstationSetup(
                symbol=symbol,
                timeframe=payload.timeframe,
                direction=analysis.decision,
                confidence=analysis.confidence,
                risk_reward=analysis.risk_reward,
                entry=(analysis.entry_low + analysis.entry_high) / 2,
                entry_low=analysis.entry_low,
                entry_high=analysis.entry_high,
                stop_loss=analysis.stop_loss,
                take_profits=analysis.take_profits,
                support_levels=analysis.support_levels,
                resistance_levels=analysis.resistance_levels,
                structure_label=structure_label,
                bos_label=bos,
                choch_label=choch,
                liquidity_sweep=sweep,
                timeframe_alignment=alignment,
            )
            tf_key = payload.timeframe.lower().strip()
            if tf_key not in candles_by_tf:
                tf_key = "30m" if tf_key not in {"4h", "1h", "15m"} else tf_key
            render_candles = candles_by_tf.get(tf_key) or candles_by_tf["30m"]
            chart_urls = renderer.render_pair(render_candles, setup)
        except Exception:
            chart_urls = ("", "")

        return ChartAnalysisResponse(
            symbol=symbol,
            timeframe=payload.timeframe,
            strategy=payload.strategy,
            decision=analysis.decision,
            bias=analysis.bias,
            confidence=analysis.confidence,
            entryZone=PriceRange(low=analysis.entry_low, high=analysis.entry_high),
            stopLoss=analysis.stop_loss,
            takeProfits=analysis.take_profits,
            supportLevels=analysis.support_levels,
            resistanceLevels=analysis.resistance_levels,
            invalidationLevel=analysis.invalidation,
            riskReward=f"{analysis.risk_reward:.2f}R",
            indicators=payload.indicators or ["RSI", "MACD", "EMA 20/50", "ATR"],
            explanation=analysis.explanation,
            riskWarning=(
                "Probability-based scenario only. Wait for confirmation, respect invalidation, "
                "and use defined position sizing. This is not financial advice."
            ),
            trendDirection=analysis.trend_direction,
            source="professional-mtf-analysis-engine",
            currentPrice=round_price(contexts["15m"].close),
            rsi=round(main_signal.rsi, 2),
            macd=round(main_signal.macd, 4),
            macdSignal=round(main_signal.macd_signal, 4),
            ema20=round(main_signal.ema20, 4),
            ema50=round(main_signal.ema50, 4),
            chartImageUrl=chart_urls[0] or None,
            analyzedChartImageUrl=chart_urls[1] or None,
            structureNotes=list(analysis.notes),
            timeframeAlignment=alignment,
            marketStructure=structure_label,
        )


def build_timeframe_context(timeframe: str, candles: list[dict]) -> TimeframeContext:
    closes = [float(item["close"]) for item in candles]
    ema20 = ema_local(closes, 20)[-1] if closes else 0.0
    ema50 = ema_local(closes, 50)[-1] if closes else 0.0
    atr = average_true_range_local(candles) or max(closes[-1] * 0.01, 1e-8)
    rsi = rsi_local(closes)
    close = closes[-1]
    trend = trend_bias(candles)
    structure = str(market_structure(candles).get("trend", "range"))
    previous = candles[-25:-1]
    previous_high = max(float(item["high"]) for item in previous)
    previous_low = min(float(item["low"]) for item in previous)
    recent_high = max(float(item["high"]) for item in candles[-30:])
    recent_low = min(float(item["low"]) for item in candles[-30:])
    last = candles[-1]
    open_price = float(last["open"])
    high = float(last["high"])
    low = float(last["low"])
    candle_range = max(high - low, 1e-8)
    body = abs(close - open_price)
    upper_wick_ratio = (high - max(open_price, close)) / candle_range
    lower_wick_ratio = (min(open_price, close) - low) / candle_range
    breakout = close > previous_high
    breakdown = close < previous_low
    liquidity_sweep = (high > previous_high and close < previous_high) or (low < previous_low and close > previous_low)
    rejection: str | None = None
    if upper_wick_ratio > 0.48 and body < atr * 0.65:
        rejection = "upper wick rejection"
    elif lower_wick_ratio > 0.48 and body < atr * 0.65:
        rejection = "lower wick rejection"
    huge_impulse = body > atr * 1.55 or candle_range > atr * 2.15
    distance_from_ema20_atr = abs(close - ema20) / atr if atr else 0.0
    bias: AnalysisBias = "neutral"
    if trend == "bullish" and structure in {"HH/HL", "range"} and close >= ema20 and rsi >= 50:
        bias = "long"
    elif trend == "bearish" and structure in {"LH/LL", "range"} and close <= ema20 and rsi <= 50:
        bias = "short"

    return TimeframeContext(
        timeframe=timeframe,
        bias=bias,
        trend=trend,
        structure=structure,
        rsi=rsi,
        ema20=ema20,
        ema50=ema50,
        atr=atr,
        volume_ratio=recent_volume_ratio(candles),
        close=close,
        recent_high=recent_high,
        recent_low=recent_low,
        breakout=breakout,
        breakdown=breakdown,
        liquidity_sweep=liquidity_sweep,
        rejection=rejection,
        huge_impulse=huge_impulse,
        distance_from_ema20_atr=distance_from_ema20_atr,
    )


def build_professional_analysis(
    *,
    symbol: str,
    strategy: str,
    prompt: str | None,
    main_signal,
    contexts: dict[str, TimeframeContext],
    candles_by_tf: dict[str, list[dict]],
) -> ProfessionalAnalysis:
    main = contexts["4h"]
    confirmation = contexts["1h"]
    setup = contexts["30m"]
    entry = contexts["15m"]
    current_price = entry.close
    main_candles = candles_by_tf["4h"]
    setup_candles = candles_by_tf["30m"]
    main_atr = main.atr

    candidate_bias = choose_candidate_bias(main_signal.bias, main, confirmation)
    notes: list[str] = []

    if candidate_bias == "neutral":
        notes.append("4H trend and structure are not aligned enough for a directional setup.")
        return build_wait_analysis(symbol, strategy, prompt, contexts, notes)

    confirmation_result = confirmation_check(candles_by_tf["1h"], candidate_bias)
    main_structure = market_structure(main_candles)
    setup_structure = market_structure(setup_candles)
    swing_highs, swing_lows = swing_points(main_candles[-140:])
    support_levels = nearest_levels([value for _, value in swing_lows], current_price, "below", fallback=main.recent_low)
    resistance_levels = nearest_levels([value for _, value in swing_highs], current_price, "above", fallback=main.recent_high)
    late_entry = is_late_entry(main, confirmation, setup, candidate_bias)
    fake_breakout = looks_like_fake_breakout(main_candles, candidate_bias, main_atr)

    score = 48
    if candidate_bias == "long":
        main_aligned = main.trend == "bullish" or main.structure == "HH/HL" or main.breakout
        setup_aligned = setup.bias == "long" or setup.breakout or setup.structure == "HH/HL"
        entry_aligned = entry.bias == "long" or entry.close >= entry.ema20
        if main_aligned:
            score += 18
            notes.append(f"4H supports upside: {structure_label(main)}.")
        else:
            score -= 18
            notes.append("4H is not cleanly bullish.")
        if confirmation_result.passed:
            score += 14
            notes.append(confirmation_result.reason)
        else:
            score -= 10
            notes.append("1H has not confirmed the long setup yet.")
        if setup_aligned:
            score += 8
            notes.append(f"30m setup quality is acceptable: {structure_label(setup)}.")
        else:
            score -= 8
            notes.append("30m is still choppy, so entry needs confirmation.")
        if entry_aligned:
            score += 4
        else:
            score -= 4
            notes.append("15m timing is not ready yet.")
    else:
        main_aligned = main.trend == "bearish" or main.structure == "LH/LL" or main.breakdown
        setup_aligned = setup.bias == "short" or setup.breakdown or setup.structure == "LH/LL"
        entry_aligned = entry.bias == "short" or entry.close <= entry.ema20
        if main_aligned:
            score += 18
            notes.append(f"4H supports downside: {structure_label(main)}.")
        else:
            score -= 18
            notes.append("4H is not cleanly bearish.")
        if confirmation_result.passed:
            score += 14
            notes.append(confirmation_result.reason)
        else:
            score -= 10
            notes.append("1H has not confirmed the short setup yet.")
        if setup_aligned:
            score += 8
            notes.append(f"30m setup quality is acceptable: {structure_label(setup)}.")
        else:
            score -= 8
            notes.append("30m is still choppy, so entry needs confirmation.")
        if entry_aligned:
            score += 4
        else:
            score -= 4
            notes.append("15m timing is not ready yet.")

    if main.volume_ratio >= 1.2 or confirmation.volume_ratio >= 1.1:
        score += 5
        notes.append("Volume is supportive enough for the scenario.")
    elif main.volume_ratio < 0.85 and confirmation.volume_ratio < 0.85:
        score -= 8
        notes.append("Volume is weak, so conviction is reduced.")

    if late_entry:
        score -= 14
        notes.append("Late entry risk: price already moved far from the mean after an impulse candle. Wait for pullback or confirmation.")
    if fake_breakout or main.liquidity_sweep or confirmation.liquidity_sweep:
        score -= 18
        notes.append("Possible liquidity sweep or fake breakout detected; avoid chasing.")
    if main.rejection or confirmation.rejection:
        score -= 10
        notes.append(f"Rejection risk visible: {confirmation.rejection or main.rejection}.")
    if main.structure == "range" and confirmation.structure == "range":
        score -= 10
        notes.append("Both 4H and 1H are range-heavy, so no aggressive trade is justified.")

    levels = build_trade_levels(
        bias=candidate_bias,
        current_price=current_price,
        main=main,
        setup=setup,
        main_structure=main_structure,
        setup_structure=setup_structure,
        support_levels=support_levels,
        resistance_levels=resistance_levels,
        late_entry=late_entry,
    )

    conflict = has_level_conflict(
        main_candles,
        candidate_bias,
        levels["entry"],
        levels["stop_loss"],
        levels["take_profits"],
        main_atr,
    )
    if conflict and not (main.breakout or main.breakdown or confirmation_result.state == "breakout"):
        score -= 12
        notes.append("Nearby support/resistance reduces room to target.")

    risk_distance = abs(levels["entry"] - levels["stop_loss"])
    risk_reward = abs(levels["take_profits"][1] - levels["entry"]) / max(risk_distance, current_price * 0.001)
    if risk_reward >= 2.0:
        score += 5
        notes.append("Risk/reward is above 2R to TP2.")
    elif risk_reward < 1.35:
        score -= 18
        notes.append("Risk/reward is not strong enough for a clean signal.")

    confidence = max(40, min(92, int(score)))
    if confidence < 55:
        return build_wait_analysis(symbol, strategy, prompt, contexts, notes)

    if confidence >= 85 and confirmation_result.passed and not late_entry and not conflict and not fake_breakout:
        decision = "Strong Long" if candidate_bias == "long" else "Strong Short"
    elif candidate_bias == "long":
        decision = "Long only on confirmation"
    else:
        decision = "Short only on confirmation"

    explanation = build_specific_explanation(
        symbol=symbol,
        strategy=strategy,
        prompt=prompt,
        decision=decision,
        confidence=confidence,
        bias=candidate_bias,
        contexts=contexts,
        levels=levels,
        risk_reward=risk_reward,
        notes=notes,
        confirmation_reason=confirmation_result.reason,
    )
    return ProfessionalAnalysis(
        decision=decision,
        bias=candidate_bias,
        confidence=confidence,
        entry_low=round_price(levels["entry_low"]),
        entry_high=round_price(levels["entry_high"]),
        stop_loss=round_price(levels["stop_loss"]),
        take_profits=tuple(round_price(item) for item in levels["take_profits"]),
        support_levels=tuple(round_price(item) for item in support_levels),
        resistance_levels=tuple(round_price(item) for item in resistance_levels),
        invalidation=round_price(levels["stop_loss"]),
        risk_reward=risk_reward,
        explanation=explanation,
        notes=tuple(notes),
        trend_direction="up" if candidate_bias == "long" else "down",
    )


def choose_candidate_bias(signal_bias: str, main: TimeframeContext, confirmation: TimeframeContext) -> AnalysisBias:
    bullish = signal_bias == "long" and (main.trend == "bullish" or main.structure == "HH/HL" or main.breakout)
    bearish = signal_bias == "short" and (main.trend == "bearish" or main.structure == "LH/LL" or main.breakdown)
    if bullish and not bearish:
        return "long"
    if bearish and not bullish:
        return "short"
    if main.trend == "bullish" and confirmation.trend != "bearish" and main.rsi < 72:
        return "long"
    if main.trend == "bearish" and confirmation.trend != "bullish" and main.rsi > 28:
        return "short"
    return "neutral"


def build_trade_levels(
    *,
    bias: AnalysisBias,
    current_price: float,
    main: TimeframeContext,
    setup: TimeframeContext,
    main_structure: dict,
    setup_structure: dict,
    support_levels: tuple[float, float],
    resistance_levels: tuple[float, float],
    late_entry: bool,
) -> dict[str, float | tuple[float, float, float]]:
    atr = max(main.atr, setup.atr * 2.2, current_price * 0.002)
    if bias == "long":
        pullback_anchor = max(support_levels[0], setup.ema20, current_price - setup.atr * 0.55)
        breakout_anchor = max(current_price + setup.atr * 0.18, setup.recent_high + setup.atr * 0.04)
        entry = pullback_anchor if late_entry else min(breakout_anchor, current_price + atr * 0.35)
        entry_low = entry - atr * 0.10
        entry_high = entry + atr * 0.12
        swing_stop = min(
            float(main_structure.get("last_swing_low") or support_levels[1]),
            float(setup_structure.get("last_swing_low") or support_levels[0]),
        )
        stop_loss = min(swing_stop - atr * 0.12, entry_low - atr * 0.78)
        risk = max(entry - stop_loss, atr * 0.75, entry * 0.0025)
        stop_loss = entry - risk
        targets = choose_targets("long", entry, risk, resistance_levels)
    elif bias == "short":
        pullback_anchor = min(resistance_levels[0], setup.ema20, current_price + setup.atr * 0.55)
        breakdown_anchor = min(current_price - setup.atr * 0.18, setup.recent_low - setup.atr * 0.04)
        entry = pullback_anchor if late_entry else max(breakdown_anchor, current_price - atr * 0.35)
        entry_low = entry - atr * 0.12
        entry_high = entry + atr * 0.10
        swing_stop = max(
            float(main_structure.get("last_swing_high") or resistance_levels[1]),
            float(setup_structure.get("last_swing_high") or resistance_levels[0]),
        )
        stop_loss = max(swing_stop + atr * 0.12, entry_high + atr * 0.78)
        risk = max(stop_loss - entry, atr * 0.75, entry * 0.0025)
        stop_loss = entry + risk
        targets = choose_targets("short", entry, risk, support_levels)
    else:
        entry = current_price
        entry_low = current_price - atr * 0.16
        entry_high = current_price + atr * 0.16
        stop_loss = current_price - atr
        targets = (current_price + atr, current_price + atr * 1.5, current_price + atr * 2)

    return {
        "entry": entry,
        "entry_low": min(entry_low, entry_high),
        "entry_high": max(entry_low, entry_high),
        "stop_loss": stop_loss,
        "take_profits": targets,
    }


def choose_targets(direction: AnalysisBias, entry: float, risk: float, levels: tuple[float, float]) -> tuple[float, float, float]:
    if direction == "long":
        structural = sorted(level for level in levels if level > entry + risk * 0.65)
        defaults = [entry + risk * 1.35, entry + risk * 2.05, entry + risk * 2.9]
        merged = sorted({round_price(level) for level in [*structural, *defaults] if level > entry})
        selected = merged[:3]
        while len(selected) < 3:
            selected.append(entry + risk * (1.35 + len(selected) * 0.75))
        return selected[0], selected[1], selected[2]
    structural = sorted((level for level in levels if level < entry - risk * 0.65), reverse=True)
    defaults = [entry - risk * 1.35, entry - risk * 2.05, entry - risk * 2.9]
    merged = sorted({round_price(level) for level in [*structural, *defaults] if level < entry}, reverse=True)
    selected = merged[:3]
    while len(selected) < 3:
        selected.append(entry - risk * (1.35 + len(selected) * 0.75))
    return selected[0], selected[1], selected[2]


def build_wait_analysis(
    symbol: str,
    strategy: str,
    prompt: str | None,
    contexts: dict[str, TimeframeContext],
    notes: list[str],
) -> ProfessionalAnalysis:
    current_price = contexts["15m"].close
    main = contexts["4h"]
    setup = contexts["30m"]
    atr = max(main.atr, setup.atr * 2.0, current_price * 0.002)
    support_levels = (
        round_price(min(main.recent_low, setup.recent_low)),
        round_price(min(main.recent_low, setup.recent_low) - atr * 0.55),
    )
    resistance_levels = (
        round_price(max(main.recent_high, setup.recent_high)),
        round_price(max(main.recent_high, setup.recent_high) + atr * 0.55),
    )
    confidence = confidence_for_wait(contexts, notes)
    entry_low = current_price - atr * 0.18
    entry_high = current_price + atr * 0.18
    stop = support_levels[0]
    take_profits = (resistance_levels[0], resistance_levels[1], resistance_levels[1] + atr * 0.6)
    explanation = build_wait_explanation(symbol, strategy, prompt, contexts, notes)
    return ProfessionalAnalysis(
        decision="Neutral / Wait",
        bias="neutral",
        confidence=confidence,
        entry_low=round_price(entry_low),
        entry_high=round_price(entry_high),
        stop_loss=round_price(stop),
        take_profits=tuple(round_price(item) for item in take_profits),
        support_levels=tuple(round_price(item) for item in support_levels),
        resistance_levels=tuple(round_price(item) for item in resistance_levels),
        invalidation=round_price(stop),
        risk_reward=0.0,
        explanation=explanation,
        notes=tuple(notes),
        trend_direction="sideways",
    )


def confidence_for_wait(contexts: dict[str, TimeframeContext], notes: list[str]) -> int:
    main = contexts["4h"]
    confirmation = contexts["1h"]
    confidence = 48
    if main.structure == "range":
        confidence -= 3
    if confirmation.structure == "range":
        confidence -= 3
    if main.liquidity_sweep or confirmation.liquidity_sweep:
        confidence -= 4
    if main.huge_impulse or confirmation.huge_impulse:
        confidence -= 2
    if len(notes) >= 3:
        confidence += 2
    return max(40, min(55, confidence))


def nearest_levels(levels: list[float], price: float, side: Literal["above", "below"], *, fallback: float) -> tuple[float, float]:
    cleaned = sorted({round(float(level), 10) for level in levels if level > 0})
    if side == "above":
        candidates = [level for level in cleaned if level > price]
        if len(candidates) >= 2:
            return candidates[0], candidates[1]
        first = candidates[0] if candidates else max(fallback, price * 1.006)
        return first, max(first * 1.006, price * 1.012)
    candidates = sorted((level for level in cleaned if level < price), reverse=True)
    if len(candidates) >= 2:
        return candidates[0], candidates[1]
    first = candidates[0] if candidates else min(fallback, price * 0.994)
    return first, min(first * 0.994, price * 0.988)


def is_late_entry(main: TimeframeContext, confirmation: TimeframeContext, setup: TimeframeContext, bias: AnalysisBias) -> bool:
    if bias == "long":
        return (
            (main.huge_impulse and main.close > main.ema20)
            or (confirmation.huge_impulse and confirmation.close > confirmation.ema20)
            or setup.distance_from_ema20_atr > 1.65
            or setup.rsi > 72
        )
    if bias == "short":
        return (
            (main.huge_impulse and main.close < main.ema20)
            or (confirmation.huge_impulse and confirmation.close < confirmation.ema20)
            or setup.distance_from_ema20_atr > 1.65
            or setup.rsi < 28
        )
    return False


def structure_label(context: TimeframeContext) -> str:
    pieces = [context.trend, context.structure]
    if context.breakout:
        pieces.append("breakout")
    if context.breakdown:
        pieces.append("breakdown")
    if context.liquidity_sweep:
        pieces.append("liquidity sweep")
    if context.rejection:
        pieces.append(context.rejection)
    return ", ".join(dict.fromkeys(piece for piece in pieces if piece and piece != "range")) or "range"


def build_specific_explanation(
    *,
    symbol: str,
    strategy: str,
    prompt: str | None,
    decision: str,
    confidence: int,
    bias: AnalysisBias,
    contexts: dict[str, TimeframeContext],
    levels: dict[str, float | tuple[float, float, float]],
    risk_reward: float,
    notes: list[str],
    confirmation_reason: str,
) -> str:
    main = contexts["4h"]
    setup = contexts["30m"]
    entry_low = float(levels["entry_low"])
    entry_high = float(levels["entry_high"])
    stop = float(levels["stop_loss"])
    direction_text = "upside" if bias == "long" else "downside"
    confirmation_action = (
        "Price should hold and reclaim the entry zone before a long is valid."
        if bias == "long"
        else "Price should reject the entry zone or break lower before a short is valid."
    )
    custom_context = f" Extra context considered: {prompt.strip()}" if prompt and prompt.strip() else ""
    note_text = " ".join(notes[:4])
    return (
        f"{symbol} is rated {decision} with {confidence}% confidence using {strategy}. "
        f"4H context favors {direction_text} because {structure_label(main)}; 1H confirmation read: {confirmation_reason} "
        f"30m setup quality is {structure_label(setup)}. "
        f"Entry is a zone, not a market chase: {format_level(entry_low)}-{format_level(entry_high)}. "
        f"Invalidation is {format_level(stop)}; if price breaks that level, the idea is wrong. "
        f"{confirmation_action} Risk/reward to TP2 is about {risk_reward:.2f}R. {note_text}{custom_context}"
    )


def build_wait_explanation(
    symbol: str,
    strategy: str,
    prompt: str | None,
    contexts: dict[str, TimeframeContext],
    notes: list[str],
) -> str:
    main = contexts["4h"]
    confirmation = contexts["1h"]
    setup = contexts["30m"]
    custom_context = f" Extra context considered: {prompt.strip()}" if prompt and prompt.strip() else ""
    note_text = " ".join(notes[:5])
    return (
        f"{symbol} is Neutral / Wait under {strategy}. 4H is {structure_label(main)}, "
        f"1H is {structure_label(confirmation)}, and 30m is {structure_label(setup)}. "
        f"There is no clean edge yet, so Vypexrock should not force a long or short. "
        f"Wait for a clean 1H reclaim/breakdown, then use the entry zone only after confirmation. "
        f"{note_text}{custom_context}"
    )


def normalize_interval(value: str) -> str:
    mapping = {
        "1s": "1s",
        "1H": "1h",
        "4H": "4h",
        "1D": "1d",
        "1W": "1w",
    }
    return mapping.get(value, value)


def round_price(value: float) -> float:
    if value >= 1000:
        return round(value, 2)
    if value >= 1:
        return round(value, 4)
    return round(value, 8)


def format_level(value: float) -> str:
    if value >= 1000:
        return f"{value:,.2f}"
    if value >= 1:
        return f"{value:,.4f}"
    return f"{value:.8f}".rstrip("0").rstrip(".")
