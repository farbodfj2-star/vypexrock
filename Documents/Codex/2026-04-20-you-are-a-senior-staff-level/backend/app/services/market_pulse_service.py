from __future__ import annotations

from typing import Any


class MarketPulseService:
    async def build(self) -> dict[str, Any]:
        from app.services.market_service import MarketService

        rows = await MarketService().fetch_dashboard()
        if not rows:
            return self._empty()

        total_volume = sum(float(row.get("volume_24h", 0)) for row in rows) or 1.0
        btc = next((row for row in rows if row["symbol"] == "BTCUSDT"), rows[0])
        eth = next((row for row in rows if row["symbol"] == "ETHUSDT"), None)

        btc_weight = float(btc.get("volume_24h", 0)) / total_volume
        eth_weight = float(eth.get("volume_24h", 0)) / total_volume if eth else 0.0
        dominance = round(btc_weight * 100 / max(btc_weight + eth_weight, 1e-8) * (btc_weight + eth_weight) * 100 / 100, 1)
        if btc_weight + eth_weight > 0:
            dominance = round(btc_weight / (btc_weight + eth_weight) * 100, 1)

        avg_change = sum(float(row.get("change_24h", 0)) for row in rows) / len(rows)
        volatility = sum(abs(float(row.get("change_24h", 0))) for row in rows) / len(rows)
        fear_greed = int(max(8, min(92, 50 + avg_change * 4 - volatility * 0.8)))

        movers = sorted(rows, key=lambda row: abs(float(row.get("change_24h", 0))), reverse=True)[:8]
        gainers = sorted(rows, key=lambda row: float(row.get("change_24h", 0)), reverse=True)[:5]
        losers = sorted(rows, key=lambda row: float(row.get("change_24h", 0)))[:5]

        heatmap = sorted(rows, key=lambda row: float(row.get("volume_24h", 0)), reverse=True)[:20]
        max_vol = max(float(row.get("volume_24h", 0)) for row in heatmap) or 1.0

        return {
            "fear_greed": fear_greed,
            "fear_greed_label": self._fg_label(fear_greed),
            "btc_dominance": dominance,
            "session_volatility": round(volatility, 2),
            "market_bias": "risk-on" if avg_change > 0.35 else "risk-off" if avg_change < -0.35 else "balanced",
            "top_movers": [
                {
                    "symbol": row["symbol"],
                    "price": float(row["price"]),
                    "change_24h": float(row["change_24h"]),
                    "volume_24h": float(row["volume_24h"]),
                    "metadata_name": row.get("metadata_name"),
                    "metadata_image": row.get("metadata_image"),
                }
                for row in movers
            ],
            "gainers": [
                {
                    "symbol": row["symbol"],
                    "change_24h": float(row["change_24h"]),
                    "metadata_image": row.get("metadata_image"),
                }
                for row in gainers
            ],
            "losers": [
                {
                    "symbol": row["symbol"],
                    "change_24h": float(row["change_24h"]),
                    "metadata_image": row.get("metadata_image"),
                }
                for row in losers
            ],
            "heatmap": [
                {
                    "symbol": row["symbol"],
                    "change_24h": float(row["change_24h"]),
                    "intensity": float(row.get("volume_24h", 0)) / max_vol,
                    "metadata_image": row.get("metadata_image"),
                }
                for row in heatmap
            ],
        }

    @staticmethod
    def _fg_label(score: int) -> str:
        if score >= 75:
            return "Extreme Greed"
        if score >= 58:
            return "Greed"
        if score >= 42:
            return "Neutral"
        if score >= 25:
            return "Fear"
        return "Extreme Fear"

    @staticmethod
    def _empty() -> dict[str, Any]:
        return {
            "fear_greed": 50,
            "fear_greed_label": "Neutral",
            "btc_dominance": 0.0,
            "session_volatility": 0.0,
            "market_bias": "balanced",
            "top_movers": [],
            "gainers": [],
            "losers": [],
            "heatmap": [],
        }
