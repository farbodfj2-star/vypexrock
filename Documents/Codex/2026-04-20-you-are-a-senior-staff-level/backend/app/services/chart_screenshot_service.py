from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from typing import Protocol

from PIL import Image, ImageDraw, ImageFont


class SignalLike(Protocol):
    symbol: str
    timeframe: str
    direction: str
    entry: float
    entry_low: float
    entry_high: float
    stop_loss: float
    take_profits: tuple[float, float, float]
    confidence: int
    risk_reward: float


class ChartScreenshotService:
    def __init__(self, output_dir: str = "/tmp/vypexrock_signal_charts"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def render_signal_chart(self, candles: list[dict], signal: SignalLike) -> str:
        visible_candles = candles[-110:]
        if not visible_candles:
            raise ValueError("Cannot render chart without candle data")

        width, height = 1280, 760
        left, top, right, bottom = 78, 88, 1080, 595
        real_right = right - 180
        volume_top, volume_bottom = 610, 700
        price_values = []
        for candle in visible_candles:
            price_values.extend([float(candle["high"]), float(candle["low"])])
        entry_low = float(getattr(signal, "entry_low", signal.entry))
        entry_high = float(getattr(signal, "entry_high", signal.entry))
        price_values.extend([entry_low, entry_high, signal.entry, signal.stop_loss, *signal.take_profits])
        projected_candles = self._project_future_candles(visible_candles[-1], signal)
        for candle in projected_candles:
            price_values.extend([candle["high"], candle["low"]])
        price_min = min(price_values)
        price_max = max(price_values)
        padding = max((price_max - price_min) * 0.12, price_max * 0.002)
        price_min -= padding
        price_max += padding

        image = Image.new("RGB", (width, height), "#030405")
        draw = ImageDraw.Draw(image)
        font = load_font(12)
        title_font = load_font(20)
        small_font = load_font(13)

        draw.rounded_rectangle((24, 20, width - 24, height - 20), radius=28, fill="#0a0c10", outline="#1f2937", width=1)
        draw.rounded_rectangle((40, 36, width - 40, height - 36), radius=20, outline="#111827", width=1)
        live_price = float(getattr(signal, "current_price", visible_candles[-1]["close"]))
        draw.text((left, 40), f"Vypexrock · {signal.symbol} · {signal.timeframe.upper()}", fill="#f8fafc", font=title_font)
        draw.text((left, 64), f"Mark {live_price:,.6g}  ·  R:R {signal.risk_reward:.2f}", fill="#94a3b8", font=small_font)
        self._draw_badge(draw, signal.direction.upper(), right - 280, 38, "#2563eb", "#dbeafe", small_font)
        confidence_color = "#16a34a" if signal.confidence >= 70 else "#f59e0b"
        self._draw_badge(draw, f"{signal.confidence}% CONF", right - 150, 38, confidence_color, "#020617", small_font)

        for idx in range(7):
            y = top + (bottom - top) * idx / 6
            price = price_max - (price_max - price_min) * idx / 6
            draw.line((left, y, right, y), fill="#1e293b", width=1)
            draw.text((right + 10, y - 7), f"{price:,.6g}", fill="#94a3b8", font=font)

        for idx in range(10):
            x = left + (right - left) * idx / 9
            draw.line((x, top, x, bottom), fill="#111827", width=1)

        max_volume = max(float(candle.get("volume", 0)) for candle in visible_candles) or 1
        candle_gap = (real_right - left) / max(len(visible_candles), 1)
        candle_width = max(4, min(9, candle_gap * 0.58))
        closes = [float(candle["close"]) for candle in visible_candles]
        ema20 = ema_values(closes, 20)
        ema50 = ema_values(closes, 50)

        for index, candle in enumerate(visible_candles):
            x = left + index * candle_gap + candle_gap / 2
            open_price = float(candle["open"])
            high_price = float(candle["high"])
            low_price = float(candle["low"])
            close_price = float(candle["close"])
            color = "#14b8a6" if close_price >= open_price else "#fb3b55"
            wick_color = "#5eead4" if close_price >= open_price else "#fda4af"

            high_y = self._price_to_y(high_price, price_min, price_max, top, bottom)
            low_y = self._price_to_y(low_price, price_min, price_max, top, bottom)
            open_y = self._price_to_y(open_price, price_min, price_max, top, bottom)
            close_y = self._price_to_y(close_price, price_min, price_max, top, bottom)
            draw.line((x, high_y, x, low_y), fill=wick_color, width=1)
            draw.rounded_rectangle(
                (x - candle_width / 2, min(open_y, close_y), x + candle_width / 2, max(open_y, close_y) + 1),
                radius=2,
                fill=color,
            )

            volume_height = (float(candle.get("volume", 0)) / max_volume) * (volume_bottom - volume_top)
            draw.rectangle((x - candle_width / 2, volume_bottom - volume_height, x + candle_width / 2, volume_bottom), fill=color)

        self._draw_indicator_line(draw, ema20, price_min, price_max, top, bottom, left, candle_gap, "#60a5fa", width=2)
        self._draw_indicator_line(draw, ema50, price_min, price_max, top, bottom, left, candle_gap, "#fbbf24", width=2)
        draw.text((left, top - 26), "EMA20", fill="#60a5fa", font=font)
        draw.text((left + 58, top - 26), "EMA50", fill="#fbbf24", font=font)

        entry = signal.entry
        entry_low = float(getattr(signal, "entry_low", entry))
        entry_high = float(getattr(signal, "entry_high", entry))
        take_profits = list(signal.take_profits)
        stop = signal.stop_loss
        entry_y = self._price_to_y(entry, price_min, price_max, top, bottom)
        entry_low_y = self._price_to_y(entry_low, price_min, price_max, top, bottom)
        entry_high_y = self._price_to_y(entry_high, price_min, price_max, top, bottom)
        stop_y = self._price_to_y(stop, price_min, price_max, top, bottom)
        zone_left = real_right + 18
        zone_right = right - 20
        reward_color = (16, 185, 129, 48)
        risk_color = (244, 63, 94, 48)
        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rounded_rectangle((left, min(entry_low_y, entry_high_y), right, max(entry_low_y, entry_high_y)), radius=6, fill=(94, 234, 212, 32))
        for index, target in enumerate(take_profits, start=1):
            tp_y = self._price_to_y(target, price_min, price_max, top, bottom)
            overlay_draw.rounded_rectangle((zone_left, min(entry_y, tp_y), zone_right, max(entry_y, tp_y)), radius=6, fill=reward_color)
        overlay_draw.rounded_rectangle((zone_left, min(entry_y, stop_y), zone_right, max(entry_y, stop_y)), radius=8, fill=risk_color)
        self._draw_support_resistance_zones(
            overlay_draw,
            visible_candles,
            price_min,
            price_max,
            top,
            bottom,
            left,
            right,
        )
        image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(image)

        self._draw_projected_candles(
            draw,
            projected_candles,
            price_min,
            price_max,
            top,
            bottom,
            zone_left,
            zone_right,
            font,
        )
        self._draw_level(draw, "Entry Zone", entry, "#60a5fa", price_min, price_max, top, bottom, left, right, font)
        self._draw_level(draw, "Stop Loss", stop, "#fb7185", price_min, price_max, top, bottom, left, right, font)
        tp_colors = ["#6ee7b7", "#34d399", "#10b981"]
        for index, target in enumerate(take_profits, start=1):
            color = tp_colors[min(index - 1, len(tp_colors) - 1)]
            self._draw_level(draw, f"TP{index}", target, color, price_min, price_max, top, bottom, left, right, font)
        self._draw_structure_labels(draw, visible_candles, price_min, price_max, top, bottom, left, right, font)

        draw.text((left, height - 48), "Actionable probability-based setup. Use a stop loss and defined position sizing.", fill="#cbd5e1", font=small_font)
        draw.text((right - 210, height - 48), f"R:R {signal.risk_reward:.2f}R", fill="#c4b5fd", font=small_font)
        timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%f")
        output_path = self.output_dir / f"{signal.symbol}_{signal.timeframe}_{timestamp}_telegram_signal.png"
        image.save(output_path, "PNG")
        return str(output_path)

    def _draw_support_resistance_zones(
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
        recent = candles[-70:] if len(candles) >= 70 else candles
        if len(recent) < 20:
            return
        support = min(float(item["low"]) for item in recent)
        resistance = max(float(item["high"]) for item in recent)
        zone = max((price_max - price_min) * 0.006, resistance * 0.0008)
        support_y1 = self._price_to_y(support + zone, price_min, price_max, top, bottom)
        support_y2 = self._price_to_y(support - zone, price_min, price_max, top, bottom)
        resistance_y1 = self._price_to_y(resistance + zone, price_min, price_max, top, bottom)
        resistance_y2 = self._price_to_y(resistance - zone, price_min, price_max, top, bottom)
        draw.rounded_rectangle((left, min(support_y1, support_y2), right, max(support_y1, support_y2)), radius=5, fill=(34, 197, 94, 20))
        draw.rounded_rectangle((left, min(resistance_y1, resistance_y2), right, max(resistance_y1, resistance_y2)), radius=5, fill=(244, 63, 94, 20))

    def _draw_structure_labels(
        self,
        draw: ImageDraw.ImageDraw,
        candles: list[dict],
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        right: int,
        font: ImageFont.ImageFont,
    ) -> None:
        recent = candles[-70:] if len(candles) >= 70 else candles
        if len(recent) < 20:
            return
        support = min(float(item["low"]) for item in recent)
        resistance = max(float(item["high"]) for item in recent)
        support_y = self._price_to_y(support, price_min, price_max, top, bottom)
        resistance_y = self._price_to_y(resistance, price_min, price_max, top, bottom)
        draw.text((left + 8, max(top + 4, resistance_y - 18)), "Resistance zone", fill="#fb7185", font=font)
        draw.text((left + 8, min(bottom - 18, support_y + 6)), "Support zone", fill="#34d399", font=font)

    def _draw_badge(
        self,
        draw: ImageDraw.ImageDraw,
        text: str,
        x: int,
        y: int,
        fill: str,
        text_fill: str,
        font: ImageFont.ImageFont,
    ) -> None:
        text_box = draw.textbbox((0, 0), text, font=font)
        width = text_box[2] - text_box[0] + 22
        draw.rounded_rectangle((x, y, x + width, y + 30), radius=14, fill=fill)
        draw.text((x + 11, y + 8), text, fill=text_fill, font=font)

    def _draw_level(
        self,
        draw: ImageDraw.ImageDraw,
        label: str,
        price: float,
        color: str,
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        right: int,
        font: ImageFont.ImageFont,
    ) -> None:
        y = self._price_to_y(price, price_min, price_max, top, bottom)
        draw.line((left, y, right, y), fill=color, width=2)
        label_text = f"{label} {price:,.6g}"
        draw.rounded_rectangle((right - 120, y - 13, right + 6, y + 13), radius=6, fill=color)
        draw.text((right - 114, y - 7), label_text, fill="#020617", font=font)

    def _project_future_candles(self, last_candle: dict, signal: SignalLike, count: int = 8) -> list[dict[str, float]]:
        close = float(last_candle["close"])
        direction = 1 if "long" in signal.direction.lower() else -1
        target = float(signal.take_profits[0] if signal.take_profits else signal.entry)
        if direction < 0:
            target = float(signal.take_profits[0] if signal.take_profits else signal.entry)
        step = (target - close) / max(count, 1)
        volatility = max(abs(float(signal.entry) - float(signal.stop_loss)) * 0.12, close * 0.0009)
        candles: list[dict[str, float]] = []
        open_price = close
        for index in range(count):
            close_price = close + step * (index + 1)
            wave = ((index % 3) - 1) * volatility * 0.35
            close_price += wave
            high = max(open_price, close_price) + volatility * (1.1 + index * 0.04)
            low = min(open_price, close_price) - volatility * (0.9 + index * 0.03)
            candles.append(
                {
                    "open": open_price,
                    "high": high,
                    "low": low,
                    "close": close_price,
                }
            )
            open_price = close_price
        return candles

    def _draw_projected_candles(
        self,
        draw: ImageDraw.ImageDraw,
        candles: list[dict[str, float]],
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        right: int,
        font: ImageFont.ImageFont,
    ) -> None:
        if not candles:
            return
        gap = (right - left) / max(len(candles), 1)
        candle_width = max(8, min(14, gap * 0.52))
        closes: list[tuple[float, float]] = []
        for index, candle in enumerate(candles):
            x = left + index * gap + gap / 2
            open_y = self._price_to_y(candle["open"], price_min, price_max, top, bottom)
            close_y = self._price_to_y(candle["close"], price_min, price_max, top, bottom)
            high_y = self._price_to_y(candle["high"], price_min, price_max, top, bottom)
            low_y = self._price_to_y(candle["low"], price_min, price_max, top, bottom)
            draw.line((x, high_y, x, low_y), fill="#c084fc", width=2)
            draw.rounded_rectangle(
                (x - candle_width / 2, min(open_y, close_y), x + candle_width / 2, max(open_y, close_y) + 2),
                radius=3,
                outline="#d8b4fe",
                fill="#7c3aed",
                width=2,
            )
            closes.append((x, close_y))

        if len(closes) >= 2:
            draw.line(closes, fill="#38bdf8", width=3, joint="curve")
            end_x, end_y = closes[-1]
            draw.line((end_x - 8, end_y + 10, end_x, end_y, end_x - 11, end_y - 4), fill="#38bdf8", width=2)
        label_x = min(right - 130, left + gap * 0.2)
        label_y = max(top + 12, min(bottom - 34, closes[0][1] - 42 if closes else top + 12))
        draw.rounded_rectangle((label_x, label_y, label_x + 126, label_y + 28), radius=8, fill="#4c1d95")
        draw.text((label_x + 10, label_y + 7), "AI Projection", fill="#ede9fe", font=font)

    def _draw_indicator_line(
        self,
        draw: ImageDraw.ImageDraw,
        values: list[float],
        price_min: float,
        price_max: float,
        top: int,
        bottom: int,
        left: int,
        candle_gap: float,
        color: str,
        width: int = 1,
    ) -> None:
        if len(values) < 2:
            return
        points: list[tuple[float, float]] = []
        for index, value in enumerate(values):
            x = left + index * candle_gap + candle_gap / 2
            y = self._price_to_y(value, price_min, price_max, top, bottom)
            points.append((x, y))
        draw.line(points, fill=color, width=width)

    @staticmethod
    def _price_to_y(price: float, price_min: float, price_max: float, top: int, bottom: int) -> float:
        if price_max == price_min:
            return (top + bottom) / 2
        ratio = (price_max - price) / (price_max - price_min)
        return top + ratio * (bottom - top)


def load_font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()


def ema_values(values: list[float], period: int) -> list[float]:
    if not values:
        return []
    multiplier = 2 / (period + 1)
    current = values[0]
    result = []
    for value in values:
        current = (value - current) * multiplier + current
        result.append(current)
    return result
