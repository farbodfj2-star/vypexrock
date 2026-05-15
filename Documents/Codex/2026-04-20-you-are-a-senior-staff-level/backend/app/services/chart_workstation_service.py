from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal

from PIL import Image, ImageDraw

from app.services.chart_screenshot_service import ChartScreenshotService, ema_values, load_font
from app.services.signal_alert_service import market_structure, swing_points


@dataclass(frozen=True)
class WorkstationSetup:
    symbol: str
    timeframe: str
    direction: str
    confidence: int
    risk_reward: float
    entry: float
    entry_low: float
    entry_high: float
    stop_loss: float
    take_profits: tuple[float, float, float]
    support_levels: tuple[float, float]
    resistance_levels: tuple[float, float]
    structure_label: str
    bos_label: str | None = None
    choch_label: str | None = None
    liquidity_sweep: bool = False
    timeframe_alignment: str = ""


class ChartWorkstationService(ChartScreenshotService):
    def render_pair(
        self,
        candles: list[dict],
        setup: WorkstationSetup,
        *,
        public_prefix: str = "/api/v1/chart/media",
    ) -> tuple[str, str]:
        base_path = self._render(candles, setup, mode="base")
        analyzed_path = self._render(candles, setup, mode="analyzed")
        base_name = Path(base_path).name
        analyzed_name = Path(analyzed_path).name
        return f"{public_prefix}/{base_name}", f"{public_prefix}/{analyzed_name}"

    def _render(self, candles: list[dict], setup: WorkstationSetup, *, mode: Literal["base", "analyzed"]) -> str:
        visible = candles[-96:]
        if len(visible) < 20:
            raise ValueError("insufficient candles")

        width, height = 1360, 820
        left, top, right, bottom = 84, 96, 1120, 620
        chart_right = right - 160 if mode == "analyzed" else right
        volume_top, volume_bottom = 640, 730

        prices: list[float] = []
        for candle in visible:
            prices.extend([float(candle["high"]), float(candle["low"])])
        if mode == "analyzed":
            projected = self._project_future_from_setup(visible[-1], setup)
            for candle in projected:
                prices.extend([candle["high"], candle["low"]])
            prices.extend([setup.entry_low, setup.entry_high, setup.entry, setup.stop_loss, *setup.take_profits])

        price_min = min(prices)
        price_max = max(prices)
        pad = max((price_max - price_min) * 0.1, price_max * 0.002)
        price_min -= pad
        price_max += pad

        image = Image.new("RGB", (width, height), "#020305")
        draw = ImageDraw.Draw(image)
        font = load_font(11)
        title_font = load_font(19)
        small = load_font(12)

        draw.rounded_rectangle((20, 16, width - 20, height - 16), radius=24, fill="#080b11", outline="#1e293b")
        title = f"{setup.symbol} · {setup.timeframe.upper()} · Market chart"
        if mode == "analyzed":
            title = f"{setup.symbol} · AI workstation · {setup.direction.upper()}"
        draw.text((left, 36), title, fill="#f8fafc", font=title_font)
        draw.text((left, 58), f"Mark {float(visible[-1]['close']):,.6g}", fill="#94a3b8", font=small)

        for idx in range(6):
            y = top + (bottom - top) * idx / 5
            price = price_max - (price_max - price_min) * idx / 5
            draw.line((left, y, chart_right, y), fill="#151b28", width=1)
            draw.text((chart_right + 8, y - 6), f"{price:,.5g}", fill="#64748b", font=font)

        gap = (chart_right - left) / max(len(visible), 1)
        body_w = max(4, min(10, gap * 0.55))
        closes = [float(c["close"]) for c in visible]
        ema20 = ema_values(closes, 20)
        ema50 = ema_values(closes, 50)
        vwap = self._vwap_series(visible)

        max_vol = max(float(c.get("volume", 0)) for c in visible) or 1.0
        for index, candle in enumerate(visible):
            x = left + index * gap + gap / 2
            o, h, l, c = map(float, (candle["open"], candle["high"], candle["low"], candle["close"]))
            up = c >= o
            color = "#10b981" if up else "#ef4444"
            wick = "#6ee7b7" if up else "#fca5a5"
            hy = self._price_to_y(h, price_min, price_max, top, bottom)
            ly = self._price_to_y(l, price_min, price_max, top, bottom)
            oy = self._price_to_y(o, price_min, price_max, top, bottom)
            cy = self._price_to_y(c, price_min, price_max, top, bottom)
            draw.line((x, hy, x, ly), fill=wick, width=1)
            draw.rounded_rectangle((x - body_w / 2, min(oy, cy), x + body_w / 2, max(oy, cy) + 1), radius=2, fill=color)
            vh = (float(candle.get("volume", 0)) / max_vol) * (volume_bottom - volume_top)
            draw.rectangle((x - body_w / 2, volume_bottom - vh, x + body_w / 2, volume_bottom), fill=color)

        if mode == "analyzed":
            self._draw_indicator_line(draw, ema20, price_min, price_max, top, bottom, left, gap, "#38bdf8", 2)
            self._draw_indicator_line(draw, ema50, price_min, price_max, top, bottom, left, gap, "#fbbf24", 2)
            self._draw_indicator_line(draw, vwap, price_min, price_max, top, bottom, left, gap, "#c084fc", 1)
            overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            od = ImageDraw.Draw(overlay)
            self._draw_support_resistance_zones(od, visible, price_min, price_max, top, bottom, left, chart_right)
            self._draw_fair_value_gaps(od, visible, price_min, price_max, top, bottom, left, chart_right)
            self._draw_order_blocks(od, visible, price_min, price_max, top, bottom, left, chart_right, setup.direction)
            self._draw_trend_channel(od, closes, price_min, price_max, top, bottom, left, chart_right, gap)
            self._draw_rr_box(od, setup, price_min, price_max, top, bottom, left, chart_right)
            s1, s2 = setup.support_levels
            r1, r2 = setup.resistance_levels
            for level, color in ((s1, (16, 185, 129, 28)), (s2, (16, 185, 129, 18)), (r1, (244, 63, 94, 28)), (r2, (244, 63, 94, 18))):
                y = self._price_to_y(level, price_min, price_max, top, bottom)
                od.line((left, y, chart_right, y), fill=color, width=1)
            image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
            draw = ImageDraw.Draw(image)

            projected = self._project_future_from_setup(visible[-1], setup)
            proj_start = chart_right - len(projected) * gap
            proj_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            pod = ImageDraw.Draw(proj_overlay)
            self._draw_projected_candles_probabilistic(
                pod, projected, price_min, price_max, top, bottom, int(proj_start), chart_right
            )
            image = Image.alpha_composite(image.convert("RGBA"), proj_overlay).convert("RGB")
            draw = ImageDraw.Draw(image)

            self._draw_level(draw, "Entry", setup.entry, "#60a5fa", price_min, price_max, top, bottom, left, chart_right, font)
            self._draw_level(draw, "Stop", setup.stop_loss, "#fb7185", price_min, price_max, top, bottom, left, chart_right, font)
            for i, tp in enumerate(setup.take_profits, start=1):
                self._draw_level(draw, f"TP{i}", tp, "#34d399", price_min, price_max, top, bottom, left, chart_right, font)

            structure = setup.structure_label or market_structure(visible).get("trend", "range")
            draw.text((left + 6, top + 6), f"Structure: {structure}", fill="#e2e8f0", font=small)
            if setup.bos_label:
                draw.text((left + 6, top + 24), setup.bos_label, fill="#5eead4", font=small)
            if setup.choch_label:
                draw.text((left + 6, top + 42), setup.choch_label, fill="#fbbf24", font=small)
            if setup.liquidity_sweep:
                draw.text((left + 6, top + 60), "Liquidity sweep detected", fill="#f472b6", font=small)
            if setup.timeframe_alignment:
                draw.text((left, height - 42), setup.timeframe_alignment, fill="#94a3b8", font=small)
            draw.text((chart_right - 180, 36), f"{setup.confidence}% conf", fill="#a7f3d0", font=small)
            draw.text((chart_right - 180, 52), f"{setup.risk_reward:.2f}R", fill="#c4b5fd", font=small)
        else:
            draw.text((left, height - 36), "Live candlestick chart — pre-analysis", fill="#64748b", font=small)

        stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%f")
        suffix = "base" if mode == "base" else "analyzed"
        path = self.output_dir / f"{setup.symbol}_{setup.timeframe}_{suffix}_{stamp}.png"
        image.save(path, "PNG")
        return str(path)

    def _project_future_from_setup(self, last: dict, setup: WorkstationSetup, count: int = 10) -> list[dict[str, float]]:
        class _Sig:
            direction = setup.direction
            entry = setup.entry
            stop_loss = setup.stop_loss
            take_profits = setup.take_profits

        return self._project_future_candles(last, _Sig(), count=count)

    def _draw_fair_value_gaps(
        self,
        draw: ImageDraw.ImageDraw,
        candles: list[dict],
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        right: int,
    ) -> None:
        for index in range(2, len(candles)):
            prev = candles[index - 1]
            curr = candles[index]
            prev_high = float(prev["high"])
            prev_low = float(prev["low"])
            curr_high = float(curr["high"])
            curr_low = float(curr["low"])
            if curr_low > prev_high:
                y1 = self._price_to_y(curr_low, price_min, price_max, top, bottom)
                y2 = self._price_to_y(prev_high, price_min, price_max, top, bottom)
                x1 = left + (index - 1) * ((right - left) / max(len(candles), 1))
                x2 = left + index * ((right - left) / max(len(candles), 1))
                draw.rounded_rectangle((x1, min(y1, y2), x2, max(y1, y2)), radius=4, fill=(56, 189, 248, 36))
                draw.text((x1 + 4, min(y1, y2) + 4), "FVG", fill=(125, 211, 252, 200))
            elif curr_high < prev_low:
                y1 = self._price_to_y(prev_low, price_min, price_max, top, bottom)
                y2 = self._price_to_y(curr_high, price_min, price_max, top, bottom)
                x1 = left + (index - 1) * ((right - left) / max(len(candles), 1))
                x2 = left + index * ((right - left) / max(len(candles), 1))
                draw.rounded_rectangle((x1, min(y1, y2), x2, max(y1, y2)), radius=4, fill=(248, 113, 113, 34))
                draw.text((x1 + 4, min(y1, y2) + 4), "FVG", fill=(252, 165, 165, 200))

    def _draw_order_blocks(
        self,
        draw: ImageDraw.ImageDraw,
        candles: list[dict],
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        right: int,
        direction: str,
    ) -> None:
        if len(candles) < 12:
            return
        bullish = "long" in direction.lower()
        impulse = candles[-8:]
        base = candles[-12:-8]
        if bullish:
            ob_low = min(float(c["low"]) for c in base)
            ob_high = max(float(c["open"]) for c in base)
            color = (16, 185, 129, 42)
            label = "Demand OB"
        else:
            ob_high = max(float(c["high"]) for c in base)
            ob_low = min(float(c["open"]) for c in base)
            color = (244, 63, 94, 40)
            label = "Supply OB"
        y1 = self._price_to_y(ob_high, price_min, price_max, top, bottom)
        y2 = self._price_to_y(ob_low, price_min, price_max, top, bottom)
        x1 = left + len(candles) * 0.55 * ((right - left) / max(len(candles), 1))
        draw.rounded_rectangle((x1, min(y1, y2), right - 12, max(y1, y2)), radius=5, fill=color)
        draw.text((x1 + 6, min(y1, y2) + 5), label, fill=(226, 232, 240, 210))

    def _draw_trend_channel(
        self,
        draw: ImageDraw.ImageDraw,
        closes: list[float],
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        right: int,
        gap: float,
    ) -> None:
        if len(closes) < 30:
            return
        segment = closes[-40:]
        start = segment[0]
        end = segment[-1]
        slope = (end - start) / max(len(segment), 1)
        upper_offset = max(segment) * 0.004
        lower_offset = max(segment) * 0.004
        points_upper: list[tuple[float, float]] = []
        points_lower: list[tuple[float, float]] = []
        for index, _ in enumerate(segment):
            x = left + (len(closes) - len(segment) + index) * gap + gap / 2
            mid = start + slope * index
            yu = self._price_to_y(mid + upper_offset, price_min, price_max, top, bottom)
            yl = self._price_to_y(mid - lower_offset, price_min, price_max, top, bottom)
            points_upper.append((x, yu))
            points_lower.append((x, yl))
        if len(points_upper) >= 2:
            draw.line(points_upper, fill=(148, 163, 184, 90), width=1)
            draw.line(points_lower, fill=(148, 163, 184, 70), width=1)

    def _draw_rr_box(
        self,
        draw: ImageDraw.ImageDraw,
        setup: WorkstationSetup,
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        right: int,
    ) -> None:
        entry_y = self._price_to_y(setup.entry, price_min, price_max, top, bottom)
        stop_y = self._price_to_y(setup.stop_loss, price_min, price_max, top, bottom)
        tp_y = self._price_to_y(setup.take_profits[1], price_min, price_max, top, bottom)
        zone_left = right - 148
        draw.rounded_rectangle(
            (zone_left, min(entry_y, tp_y), right - 8, max(entry_y, tp_y)),
            radius=8,
            fill=(16, 185, 129, 34),
        )
        draw.rounded_rectangle(
            (zone_left, min(entry_y, stop_y), right - 8, max(entry_y, stop_y)),
            radius=8,
            fill=(244, 63, 94, 32),
        )
        draw.text((zone_left + 8, min(entry_y, tp_y) + 6), f"Reward · {setup.risk_reward:.2f}R", fill=(167, 243, 208, 220))

    def _draw_projected_candles_probabilistic(
        self,
        draw: ImageDraw.ImageDraw,
        candles: list[dict[str, float]],
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        right: int,
    ) -> None:
        if not candles:
            return
        gap = (right - left) / max(len(candles), 1)
        for index, candle in enumerate(candles):
            alpha = int(55 + (index / max(len(candles), 1)) * 120)
            x = left + index * gap + gap / 2
            body_w = max(6, min(12, gap * 0.5))
            oy = self._price_to_y(candle["open"], price_min, price_max, top, bottom)
            cy = self._price_to_y(candle["close"], price_min, price_max, top, bottom)
            hy = self._price_to_y(candle["high"], price_min, price_max, top, bottom)
            ly = self._price_to_y(candle["low"], price_min, price_max, top, bottom)
            up = candle["close"] >= candle["open"]
            fill = (52, 211, 153, alpha) if up else (248, 113, 113, alpha)
            wick = (110, 231, 183, alpha) if up else (252, 165, 165, alpha)
            draw.line((x, hy, x, ly), fill=wick, width=1)
            draw.rounded_rectangle(
                (x - body_w / 2, min(oy, cy), x + body_w / 2, max(oy, cy) + 1),
                radius=2,
                fill=fill,
            )
        draw.text((left + 8, top + 78), "Probabilistic path (scenario, not forecast)", fill=(196, 181, 253, 200))

    @staticmethod
    def _vwap_series(candles: list[dict]) -> list[float]:
        total_pv = 0.0
        total_v = 0.0
        out: list[float] = []
        for candle in candles:
            typical = (float(candle["high"]) + float(candle["low"]) + float(candle["close"])) / 3
            vol = max(float(candle.get("volume", 0)), 1e-8)
            total_pv += typical * vol
            total_v += vol
            out.append(total_pv / total_v)
        return out


def structure_annotations(candles: list[dict]) -> tuple[str, str | None, str | None, bool]:
    structure = market_structure(candles)
    label = str(structure.get("trend", "range"))
    highs, lows = swing_points(candles)
    bos = None
    choch = None
    if label == "HH/HL" and len(highs) >= 2:
        bos = "BOS · bullish continuation"
    elif label == "LH/LL" and len(lows) >= 2:
        bos = "BOS · bearish continuation"
    if len(highs) >= 2 and len(lows) >= 2:
        if highs[-1][1] < highs[-2][1] and lows[-1][1] > lows[-2][1]:
            choch = "CHoCH · bearish shift"
        elif highs[-1][1] > highs[-2][1] and lows[-1][1] < lows[-2][1]:
            choch = "CHoCH · bullish shift"
    recent = candles[-30:]
    prev = candles[-60:-30] if len(candles) >= 60 else candles[:-1]
    sweep = False
    if recent and prev:
        ph = max(float(c["high"]) for c in prev)
        pl = min(float(c["low"]) for c in prev)
        last = recent[-1]
        sweep = float(last["high"]) > ph and float(last["close"]) < ph
        sweep = sweep or (float(last["low"]) < pl and float(last["close"]) > pl)
    return label, bos, choch, sweep
