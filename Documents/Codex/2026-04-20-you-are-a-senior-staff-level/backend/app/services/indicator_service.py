from statistics import mean


def ema(values: list[float], period: int) -> list[float]:
    if len(values) < period:
        return []
    multiplier = 2 / (period + 1)
    seed = mean(values[:period])
    results = [seed]
    for price in values[period:]:
        seed = ((price - seed) * multiplier) + seed
        results.append(seed)
    return results


def rsi(values: list[float], period: int = 14) -> list[float]:
    if len(values) <= period:
        return []
    gains: list[float] = []
    losses: list[float] = []
    for idx in range(1, len(values)):
        delta = values[idx] - values[idx - 1]
        gains.append(max(delta, 0))
        losses.append(abs(min(delta, 0)))

    avg_gain = mean(gains[:period])
    avg_loss = mean(losses[:period])
    rsis: list[float] = []

    for idx in range(period, len(gains)):
        avg_gain = ((avg_gain * (period - 1)) + gains[idx]) / period
        avg_loss = ((avg_loss * (period - 1)) + losses[idx]) / period
        if avg_loss == 0:
            rsis.append(100.0)
        else:
            rs = avg_gain / avg_loss
            rsis.append(100 - (100 / (1 + rs)))
    return rsis


def macd(values: list[float], fast: int = 12, slow: int = 26, signal_period: int = 9) -> tuple[list[float], list[float], list[float]]:
    if len(values) < slow:
        return [], [], []
    fast_ema = ema(values, fast)
    slow_ema = ema(values, slow)
    min_len = min(len(fast_ema), len(slow_ema))
    macd_line = [fast_ema[-min_len + idx] - slow_ema[idx] for idx in range(min_len)]
    signal_line = ema(macd_line, signal_period)
    hist_len = min(len(macd_line), len(signal_line))
    histogram = [macd_line[-hist_len + idx] - signal_line[idx] for idx in range(hist_len)]
    return macd_line, signal_line, histogram


def average_true_range(candles: list[dict], period: int = 14) -> float:
    if len(candles) < period + 1:
        return 0.0
    trs: list[float] = []
    for idx in range(1, len(candles)):
        current = candles[idx]
        prev_close = float(candles[idx - 1]["close"])
        high = float(current["high"])
        low = float(current["low"])
        trs.append(max(high - low, abs(high - prev_close), abs(low - prev_close)))
    recent = trs[-period:]
    return sum(recent) / len(recent)
