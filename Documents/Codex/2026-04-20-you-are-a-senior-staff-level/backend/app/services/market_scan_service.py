from __future__ import annotations

import asyncio
from typing import Any

from app.services.market_service import MarketService
from app.services.signal_service import SignalEngine


def _tier_from_confidence(confidence: int, bias: str) -> str:
    if bias not in {"long", "short"}:
        return "No Trade"
    if confidence >= 88:
        return "S Tier"
    if confidence >= 78:
        return "A Tier"
    if confidence >= 68:
        return "B Tier"
    if confidence >= 55:
        return "Watchlist"
    return "No Trade"


def _risk_from_confidence(confidence: int) -> str:
    if confidence >= 82:
        return "Low"
    if confidence >= 68:
        return "Medium"
    return "High"


def _direction_label(bias: str) -> str:
    if bias == "long":
        return "Long"
    if bias == "short":
        return "Short"
    return "Wait"


def _passes_scan_quality(*, bias: str, confidence: int, risk_reward: float, structure: str) -> bool:
    if bias not in {"long", "short"}:
        return False
    if confidence < 72:
        return False
    if risk_reward < 1.35:
        return False
    if structure == "range" and confidence < 80:
        return False
    return True


def _trigger_text(structure: str, bias: str) -> str:
    if structure == "breakout" and bias == "long":
        return "Break and hold above range high"
    if structure == "breakdown" and bias == "short":
        return "Break and hold below range low"
    if bias == "long":
        return "Pullback into demand with reclaim"
    if bias == "short":
        return "Rejection from supply / lower high"
    return "Await cleaner structure"


class MarketScanService:
    def __init__(self) -> None:
        self.market_service = MarketService()
        self.signal_engine = SignalEngine()

    async def scan_opportunities(self, *, limit: int = 12, timeframe: str = "15m") -> list[dict[str, Any]]:
        dashboard = await self.market_service.fetch_dashboard()
        ranked = sorted(dashboard, key=lambda row: float(row.get("volume_24h", 0)), reverse=True)
        hot = await self.market_service.fetch_hot_usdt_symbols(limit=max(limit * 2, 20))
        symbols = list(
            dict.fromkeys(
                [str(row["symbol"]) for row in ranked[: max(limit * 2, 16)]]
                + [symbol for symbol in hot if symbol.endswith("USDT")]
            )
        )[: max(limit * 3, 24)]

        async def scan_symbol(symbol: str) -> dict[str, Any] | None:
            try:
                candles = await self.market_service.fetch_candles(symbol, timeframe, limit=120)
                if len(candles) < 40:
                    return None
                computed = await self.signal_engine.compute(candles, use_ai=False)
                ticker = next((row for row in ranked if row["symbol"] == symbol), {})
                volume = float(ticker.get("volume_24h", 0))
                change = float(ticker.get("change_24h", 0))
                risk_distance = abs(float(computed.entry_high) - float(computed.stop_loss)) or 1e-8
                reward_distance = abs(float(computed.take_profit_2) - float(computed.entry_high))
                rr = reward_distance / risk_distance
                if not _passes_scan_quality(
                    bias=computed.bias,
                    confidence=int(computed.confidence),
                    risk_reward=rr,
                    structure=computed.structure_state,
                ):
                    return None
                tier = _tier_from_confidence(computed.confidence, computed.bias)
                if tier == "No Trade":
                    return None
                return {
                    "symbol": symbol,
                    "tier": tier,
                    "direction": _direction_label(computed.bias),
                    "confidence": int(computed.confidence),
                    "risk": _risk_from_confidence(computed.confidence),
                    "timeframe": f"{timeframe.upper()} / 1H / 4H",
                    "trigger": _trigger_text(computed.structure_state, computed.bias),
                    "structure": computed.structure_state.replace("_", " ").title(),
                    "volume": f"{volume:,.0f} 24h notional" if volume else "Volume n/a",
                    "liquidity": "Sweep risk elevated" if abs(change) > 6 else "Range liquidity mapped",
                    "note": computed.suggested_risk_note or computed.explanation[:160],
                    "price": float(ticker.get("price", candles[-1]["close"])),
                    "risk_reward": round(rr, 2),
                    "entry_low": float(computed.entry_low),
                    "entry_high": float(computed.entry_high),
                    "stop_loss": float(computed.stop_loss),
                    "take_profit_1": float(computed.take_profit_1),
                    "take_profit_2": float(computed.take_profit_2),
                    "take_profit_3": float(computed.take_profit_3),
                }
            except Exception:
                return None

        results = await asyncio.gather(*(scan_symbol(symbol) for symbol in symbols))
        opportunities = [item for item in results if item]
        opportunities.sort(key=lambda row: (row["confidence"], row.get("risk_reward", 0)), reverse=True)
        return opportunities[:limit]
