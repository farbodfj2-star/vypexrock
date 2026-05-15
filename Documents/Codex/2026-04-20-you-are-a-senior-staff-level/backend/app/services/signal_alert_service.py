from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal, get_redis
from app.models.telegram import TelegramAccount
from app.services.chart_screenshot_service import ChartScreenshotService
from app.services.market_service import MarketService
from app.services.signal_service import SignalEngine
from app.services.telegram_service import send_signal_alert
from app.services.telegram_service import send_telegram_photo
from app.services.telegram_service import send_telegram_message

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ConfirmationResult:
    passed: bool
    score: int
    reason: str
    state: str
    volume_ratio: float
    notes: tuple[str, ...]


@dataclass(frozen=True)
class TelegramSignal:
    symbol: str
    timeframe: str
    confirmation_timeframe: str
    direction: str
    entry: float
    entry_low: float
    entry_high: float
    stop_loss: float
    take_profits: tuple[float, float, float]
    confidence: int
    risk_reward: float
    reason: str
    main_reason: str
    confirmation_reason: str
    invalidation: float
    bias: str
    current_price: float
    entry_trigger: float
    structure_state: str
    confirmation_state: str
    entry_timing_state: str
    entry_timing_reason: str
    position_size: float
    risk_amount: float
    risk_percent: float
    volume_ratio: float
    confirmation_volume_ratio: float
    quality_score: int
    quality_notes: tuple[str, ...]
    expires_at: str


@dataclass(frozen=True)
class TelegramCredentials:
    chat_id: str
    bot_token: str


class SignalAlertAutomationService:
    def __init__(self):
        self.market_service = MarketService()
        self.signal_engine = SignalEngine()
        self.screenshot_service = ChartScreenshotService()

    async def scan_and_send(self, *, force: bool = False) -> dict[str, Any]:
        return await self.send_best_setup_signal(force=force)

    async def send_market_report_and_signals(
        self,
        *,
        force: bool = False,
        chat_id: str | None = None,
        bot_token: str | None = None,
    ) -> dict[str, Any]:
        market_result = await self.send_hourly_market_update(force=force, chat_id=chat_id, bot_token=bot_token)
        signal_result = await self.send_best_setup_signal(force=force, chat_id=chat_id, bot_token=bot_token)
        return {
            "status": "ok",
            "market_report": market_result,
            "best_setup": signal_result,
            "checked": signal_result.get("checked", 0),
            "signals_sent": signal_result.get("sent", 0),
        }

    async def send_hourly_market_update(
        self,
        *,
        force: bool = False,
        chat_id: str | None = None,
        bot_token: str | None = None,
    ) -> dict[str, Any]:
        if not settings.telegram_market_update_enabled and not force:
            return {"status": "skipped", "reason": "telegram market updates disabled", "sent": 0}

        credentials = TelegramCredentials(chat_id=chat_id, bot_token=bot_token) if chat_id and bot_token else await self._resolve_credentials()
        if not credentials:
            return {"status": "skipped", "reason": "telegram bot token or chat id missing", "sent": 0}

        logger.info("Running Telegram hourly market pulse")
        market_rows = await self._fetch_market_rows()
        top_rows = top_market_rows(market_rows, settings.telegram_market_top_assets_count)
        report = self._build_market_report(top_rows)
        delivery = await send_telegram_message(report, chat_id=credentials.chat_id, bot_token=credentials.bot_token)
        logger.info("Telegram hourly market pulse status=%s assets=%s", delivery.get("status"), len(top_rows))
        await self._record_log(
            kind="market_pulse",
            status=str(delivery.get("status")),
            detail=f"Hourly market pulse sent with {len(top_rows)} hot assets.",
            message_id=delivery.get("message_id"),
        )
        return {"status": delivery.get("status"), "sent": 1 if delivery.get("status") == "sent" else 0, "assets": len(top_rows)}

    async def send_best_setup_signal(
        self,
        *,
        force: bool = False,
        chat_id: str | None = None,
        bot_token: str | None = None,
    ) -> dict[str, Any]:
        if not settings.telegram_signal_enabled and not force:
            return {"status": "skipped", "reason": "telegram signal automation disabled", "sent": 0, "checked": 0}

        credentials = TelegramCredentials(chat_id=chat_id, bot_token=bot_token) if chat_id and bot_token else await self._resolve_credentials()
        if not credentials:
            return {"status": "skipped", "reason": "telegram bot token or chat id missing", "sent": 0, "checked": 0}

        candidates = await self._collect_signal_candidates(force=force)
        best = best_signal_candidate(candidates["signals"])
        if not best:
            early = best_signal_candidate(candidates["early"])
            if early:
                early_signal, early_candles = early
                if await self._passes_cooldown(early_signal):
                    screenshot_path = self.screenshot_service.render_signal_chart(early_candles, early_signal)
                    delivery = await send_signal_alert(early_signal, screenshot_path, chat_id=credentials.chat_id, bot_token=credentials.bot_token)
                    await self._record_watchlist_sent(early_signal, delivery)
                    return {
                        "status": "early_signal",
                        "checked": candidates["checked"],
                        "sent": 1 if delivery.get("status") == "sent" else 0,
                        "early_signal": asdict(early_signal),
                        "high_volatility": candidates["high_volatility"],
                        "skipped": candidates["skipped"][:20],
                    }

            watchlist = best_watchlist_candidate(candidates["watchlist"])
            if watchlist:
                watchlist_signal, watchlist_candles = watchlist
                if await self._passes_watchlist_cooldown(watchlist_signal):
                    screenshot_path = self.screenshot_service.render_signal_chart(watchlist_candles, watchlist_signal)
                    delivery = await send_telegram_photo(
                        screenshot_path,
                        format_watchlist_alert(watchlist_signal),
                        chat_id=credentials.chat_id,
                        bot_token=credentials.bot_token,
                    )
                    if delivery.get("status") != "sent":
                        delivery = await send_telegram_message(format_watchlist_alert(watchlist_signal), chat_id=credentials.chat_id, bot_token=credentials.bot_token)
                    await self._record_watchlist_sent(watchlist_signal, delivery)
                    return {
                        "status": "watchlist",
                        "checked": candidates["checked"],
                        "sent": 1 if delivery.get("status") == "sent" else 0,
                        "watchlist_alert": asdict(watchlist_signal),
                        "high_volatility": candidates["high_volatility"],
                        "skipped": candidates["skipped"][:20],
                    }

            status_delivery = await self._send_market_status_if_due(credentials, force=force)
            logger.info(
                "Telegram selective scan found no eligible setup checked=%s early=%s watchlist=%s skipped=%s status=%s sample_skips=%s",
                candidates["checked"],
                len(candidates["early"]),
                len(candidates["watchlist"]),
                len(candidates["skipped"]),
                status_delivery.get("status"),
                candidates["skipped"][:5],
            )
            await self._record_log(
                kind="market_status",
                status=str(status_delivery.get("status")),
                detail="No 50%+ clean setup eligible after filters.",
                message_id=status_delivery.get("message_id"),
            )
            return {
                "status": status_delivery.get("status", "skipped"),
                "reason": "no 50%+ clean setup eligible; hourly status only",
                "checked": candidates["checked"],
                "sent": 1 if status_delivery.get("status") == "sent" else 0,
                "best_setup": None,
                "market_status": status_delivery,
                "high_volatility": candidates["high_volatility"],
                "skipped": candidates["skipped"][:20],
            }

        signal, main_candles = best
        screenshot_path = self.screenshot_service.render_signal_chart(main_candles, signal)
        delivery = await send_signal_alert(signal, screenshot_path, chat_id=credentials.chat_id, bot_token=credentials.bot_token)
        if delivery.get("status") == "sent":
            await self._record_sent(signal, delivery)
        logger.info(
            "Telegram MTF signal status=%s symbol=%s direction=%s confidence=%s rr=%.2f",
            delivery.get("status"),
            signal.symbol,
            signal.direction,
            signal.confidence,
            signal.risk_reward,
        )
        await self._record_log(
            kind="best_setup",
            status=str(delivery.get("status")),
            detail=f"{signal.symbol} {signal.timeframe}/{signal.confirmation_timeframe} {signal.direction} {signal.confidence}% {signal.risk_reward:.2f}R",
            message_id=delivery.get("message_id"),
            symbol=signal.symbol,
        )
        return {
            "status": "ok",
            "checked": candidates["checked"],
            "sent": 1 if delivery.get("status") == "sent" else 0,
            "best_setup": asdict(signal),
            "high_volatility": candidates["high_volatility"],
            "skipped": candidates["skipped"][:20],
        }

    async def track_open_signals(self) -> dict[str, Any]:
        credentials = await self._resolve_credentials()
        if not credentials:
            return {"status": "skipped", "reason": "telegram bot token or chat id missing", "checked": 0}

        redis = await get_redis()
        active = await redis.hgetall("telegram_active_signals")
        checked = 0
        followups = 0
        for signal_id, raw_payload in active.items():
            checked += 1
            try:
                payload = json.loads(raw_payload)
                updates = await self._evaluate_open_signal(signal_id, payload, credentials)
                followups += updates
            except Exception as exc:  # pragma: no cover - surfaced in worker logs
                logger.warning("Failed to track Telegram signal %s: %s", signal_id, exc)
        return {"status": "ok", "checked": checked, "followups": followups}

    async def send_mock_test_signal(self, chat_id: str | None = None, bot_token: str | None = None) -> dict[str, Any]:
        symbol = "BTCUSDT"
        main_tf = settings.telegram_signal_timeframe
        confirmation_tf = settings.telegram_confirmation_timeframe
        trend_tf = settings.telegram_trend_timeframe
        fast_tf = settings.telegram_fast_timeframe
        main_candles = await self.market_service.fetch_candles(symbol, main_tf, limit=180)
        confirmation_candles = await self.market_service.fetch_candles(symbol, confirmation_tf, limit=180)
        trend_candles = await self.market_service.fetch_candles(symbol, trend_tf, limit=180)
        fast_candles = await self.market_service.fetch_candles(symbol, fast_tf, limit=140)
        signal = await self._build_signal(symbol, main_tf, main_candles, confirmation_tf, confirmation_candles, trend_tf, trend_candles, fast_tf, fast_candles)
        screenshot_path = self.screenshot_service.render_signal_chart(main_candles, signal)
        delivery = await send_signal_alert(signal, screenshot_path, chat_id=chat_id, bot_token=bot_token)
        return {"status": delivery.get("status", "unknown"), "delivery": delivery, "signal": asdict(signal)}

    async def _resolve_credentials(self) -> TelegramCredentials | None:
        if settings.telegram_bot_token and settings.telegram_chat_id:
            return TelegramCredentials(chat_id=settings.telegram_chat_id, bot_token=settings.telegram_bot_token)

        async with AsyncSessionLocal() as db:
            account = await db.scalar(
                select(TelegramAccount)
                .where(TelegramAccount.bot_token.is_not(None), TelegramAccount.chat_id.is_not(None))
                .order_by(TelegramAccount.updated_at.desc())
            )
            if account and account.bot_token and account.chat_id:
                return TelegramCredentials(chat_id=account.chat_id, bot_token=account.bot_token)
        return None

    async def _build_signal(
        self,
        symbol: str,
        timeframe: str,
        main_candles: list[dict],
        confirmation_timeframe: str,
        confirmation_candles: list[dict],
        trend_timeframe: str,
        trend_candles: list[dict],
        fast_timeframe: str,
        fast_candles: list[dict],
    ) -> TelegramSignal:
        if len(main_candles) < 80 or len(confirmation_candles) < 80 or len(trend_candles) < 80 or len(fast_candles) < 60:
            raise ValueError("not enough candle history for MTF signal")

        computed = await self.signal_engine.compute(main_candles, use_ai=False)
        tactical_bias = computed.bias if computed.bias in {"long", "short"} else tactical_bias_from_candles(main_candles)
        current_price = float(main_candles[-1]["close"])
        atr = average_true_range_local(main_candles) or max(current_price * 0.015, 1e-8)
        recent_high = max(float(item["high"]) for item in main_candles[-30:])
        recent_low = min(float(item["low"]) for item in main_candles[-30:])
        swing = market_structure(main_candles)

        if tactical_bias == "long":
            entry_trigger = max(current_price + atr * 0.10, min(recent_high + atr * 0.04, current_price + atr * 0.30))
            entry_low = entry_trigger - atr * 0.18
            entry_high = entry_trigger + atr * 0.10
            raw_stop = min(swing.get("last_swing_low") or recent_low, current_price - atr * 1.15)
            stop_loss = min(raw_stop, entry_low - atr * 0.80)
            risk_distance = max(entry_trigger - stop_loss, atr * 0.85, entry_trigger * 0.0025)
            stop_loss = entry_trigger - risk_distance
            take_profits = (
                entry_trigger + risk_distance * 1.5,
                entry_trigger + risk_distance * 2.2,
                entry_trigger + risk_distance * 3.0,
            )
        elif tactical_bias == "short":
            entry_trigger = min(current_price - atr * 0.10, max(recent_low - atr * 0.04, current_price - atr * 0.30))
            entry_low = entry_trigger - atr * 0.10
            entry_high = entry_trigger + atr * 0.18
            raw_stop = max(swing.get("last_swing_high") or recent_high, current_price + atr * 1.15)
            stop_loss = max(raw_stop, entry_high + atr * 0.80)
            risk_distance = max(stop_loss - entry_trigger, atr * 0.85, entry_trigger * 0.0025)
            stop_loss = entry_trigger + risk_distance
            take_profits = (
                entry_trigger - risk_distance * 1.5,
                entry_trigger - risk_distance * 2.2,
                entry_trigger - risk_distance * 3.0,
            )
        else:
            entry_trigger = (float(computed.entry_low) + float(computed.entry_high)) / 2
            entry_low = min(float(computed.entry_low), float(computed.entry_high))
            entry_high = max(float(computed.entry_low), float(computed.entry_high))
            stop_loss = float(computed.stop_loss)
            risk_distance = max(abs(entry_trigger - stop_loss), entry_trigger * 0.0025)
            take_profits = (
                float(computed.take_profit_1),
                float(computed.take_profit_2),
                float(computed.take_profit_3),
            )

        reward_distance = abs(take_profits[-1] - entry_trigger)
        risk_reward = reward_distance / risk_distance if risk_distance else 0
        volume_ratio = recent_volume_ratio(main_candles)
        trend_alignment = trend_filter_check(trend_candles, tactical_bias, trend_timeframe.upper())
        quality = signal_quality_score(
            symbol=symbol,
            candles=main_candles,
            bias=tactical_bias,
            base_confidence=int(computed.confidence),
            risk_reward=risk_reward,
            volume_ratio=volume_ratio,
            atr=atr,
            entry=entry_trigger,
            stop_loss=stop_loss,
            take_profits=take_profits,
        )
        confirmation = confirmation_check(confirmation_candles, tactical_bias, confirmation_timeframe.upper())
        fast_timing = entry_timing_check(fast_candles, tactical_bias, fast_timeframe.upper())
        confidence = min(96, max(0, int(quality["score"]) + confirmation.score + trend_alignment.score + fast_timing.score))
        direction = "Wait"
        if tactical_bias == "long":
            if confidence >= settings.telegram_elite_signal_confidence:
                direction = "Elite Long"
            else:
                direction = "Strong Long" if confidence >= settings.telegram_signal_strong_confidence else "Long"
        elif tactical_bias == "short":
            if confidence >= settings.telegram_elite_signal_confidence:
                direction = "Elite Short"
            else:
                direction = "Strong Short" if confidence >= settings.telegram_signal_strong_confidence else "Short"

        risk_amount = settings.telegram_signal_example_account_size * (settings.telegram_signal_risk_percent / 100)
        position_size = risk_amount / risk_distance if risk_distance else 0
        trend = "bullish" if tactical_bias == "long" else "bearish"
        macd_state = "bullish" if computed.macd > computed.macd_signal else "bearish" if computed.macd < computed.macd_signal else "flat"
        main_reason = (
            f"{timeframe.upper()} {trend} setup with {quality['structure_label']} structure, "
            f"{volume_ratio:.2f}x volume, RSI {computed.rsi:.1f}, and {macd_state} MACD."
        )
        confirmation_reason = confirmation.reason
        reason = (
            f"{main_reason} {confirmation_timeframe.upper()} structure confirmation: {confirmation_reason} "
            f"{trend_timeframe.upper()} trend filter: {trend_alignment.reason} "
            f"{fast_timeframe.upper()} entry timing: {fast_timing.reason}"
        )

        return TelegramSignal(
            symbol=symbol,
            timeframe=timeframe.upper(),
            confirmation_timeframe=confirmation_timeframe.upper(),
            direction=direction,
            entry=round(entry_trigger, 8),
            entry_low=round(min(entry_low, entry_high), 8),
            entry_high=round(max(entry_low, entry_high), 8),
            stop_loss=round(stop_loss, 8),
            take_profits=tuple(round(item, 8) for item in take_profits),
            confidence=confidence,
            risk_reward=round(risk_reward, 2),
            reason=reason,
            main_reason=main_reason,
            confirmation_reason=f"{confirmation_reason} {trend_alignment.reason}",
            invalidation=round(stop_loss, 8),
            bias=tactical_bias,
            current_price=round(current_price, 8),
            entry_trigger=round(entry_trigger, 8),
            structure_state=str(quality["structure_label"]),
            confirmation_state=confirmation.state,
            entry_timing_state=fast_timing.state,
            entry_timing_reason=fast_timing.reason,
            position_size=round(position_size, 6),
            risk_amount=round(risk_amount, 2),
            risk_percent=settings.telegram_signal_risk_percent,
            volume_ratio=round(volume_ratio, 2),
            confirmation_volume_ratio=round(confirmation.volume_ratio, 2),
            quality_score=int(quality["score"]),
            quality_notes=tuple(str(note) for note in [*quality["notes"], *confirmation.notes, *trend_alignment.notes, *fast_timing.notes]),
            expires_at=(datetime.now(UTC) + timedelta(hours=settings.telegram_signal_expiry_hours)).isoformat(),
        )

    def _passes_quality(self, signal: TelegramSignal, main_candles: list[dict] | None = None) -> bool:
        if signal.bias not in {"long", "short"}:
            return False
        if signal.confidence < settings.telegram_signal_min_confidence:
            return False
        if signal.quality_score < settings.telegram_signal_min_confidence - 12:
            return False
        if signal.risk_reward < settings.telegram_signal_min_risk_reward:
            return False
        if signal.volume_ratio < 0.85:
            return False
        if signal.confirmation_state in {"failed", "unclear", "rejection"}:
            return False
        if signal.entry_timing_state in {"failed", "late", "reversal"}:
            return False
        if not signal.stop_loss or not signal.take_profits:
            return False
        if main_candles and not setup_is_clean(main_candles, signal):
            return False
        return True

    def _passes_early_quality(self, signal: TelegramSignal, main_candles: list[dict] | None = None) -> bool:
        if signal.bias not in {"long", "short"}:
            return False
        if not (settings.telegram_early_signal_min_confidence <= signal.confidence < settings.telegram_signal_min_confidence):
            return False
        if signal.risk_reward < 1.2:
            return False
        if signal.confirmation_state in {"failed", "rejection"}:
            return False
        if signal.entry_timing_state in {"failed", "late", "reversal"}:
            return False
        if signal.volume_ratio <= 0.01 and signal.symbol.endswith("USDT"):
            return False
        if main_candles and (is_messy_sideways(main_candles) or is_huge_impulse_without_pullback(main_candles)):
            return False
        return True

    def _passes_watchlist_quality(self, signal: TelegramSignal, main_candles: list[dict] | None = None) -> bool:
        if signal.bias not in {"long", "short"}:
            return False
        if not (settings.telegram_watchlist_min_confidence <= signal.confidence < settings.telegram_early_signal_min_confidence):
            return False
        if signal.risk_reward < 1.0:
            return False
        if signal.entry_timing_state == "reversal":
            return False
        if signal.volume_ratio <= 0.01 and signal.symbol.endswith("USDT"):
            return False
        if main_candles and is_messy_sideways(main_candles):
            return False
        return True

    async def _collect_signal_candidates(self, *, force: bool = False) -> dict[str, Any]:
        checked = 0
        skipped: list[dict[str, str]] = []
        signals: list[tuple[TelegramSignal, list[dict]]] = []
        early: list[tuple[TelegramSignal, list[dict]]] = []
        watchlist: list[tuple[TelegramSignal, list[dict]]] = []
        confirmation_tf = settings.telegram_confirmation_timeframe
        trend_tf = settings.telegram_trend_timeframe
        fast_tf = settings.telegram_fast_timeframe
        high_volatility = False
        for symbol in await self._signal_symbols():
            try:
                confirmation_candles = await self.market_service.fetch_candles(symbol, confirmation_tf, limit=180)
                trend_candles = await self.market_service.fetch_candles(symbol, trend_tf, limit=180)
                fast_candles = await self.market_service.fetch_candles(symbol, fast_tf, limit=140)
            except Exception as exc:  # pragma: no cover - surfaced in worker logs
                for main_tf in signal_timeframes():
                    checked += 1
                    skipped.append({"symbol": f"{symbol}:{main_tf}", "reason": str(exc)[:140]})
                continue
            for main_tf in signal_timeframes():
                checked += 1
                try:
                    main_candles = await self.market_service.fetch_candles(symbol, main_tf, limit=180)
                    high_volatility = high_volatility or is_high_volatility(main_candles, symbol)
                    signal = await self._build_signal(symbol, main_tf, main_candles, confirmation_tf, confirmation_candles, trend_tf, trend_candles, fast_tf, fast_candles)
                    if signal.confidence < settings.telegram_watchlist_min_confidence:
                        skipped.append({"symbol": f"{symbol}:{main_tf}", "reason": f"confidence below 50% ({signal.confidence}%)"})
                        continue
                    if self._passes_quality(signal, main_candles):
                        if not force and not await self._passes_cooldown(signal):
                            skipped.append({"symbol": symbol, "reason": "duplicate cooldown"})
                            continue
                        signals.append((signal, main_candles))
                    elif self._passes_early_quality(signal, main_candles):
                        early.append((signal, main_candles))
                    elif self._passes_watchlist_quality(signal, main_candles):
                        watchlist.append((signal, main_candles))
                    else:
                        skipped.append({"symbol": f"{symbol}:{main_tf}", "reason": "; ".join(signal.quality_notes[:4]) or "MTF quality filter"})
                except Exception as exc:  # pragma: no cover - surfaced in worker logs
                    skipped.append({"symbol": f"{symbol}:{main_tf}", "reason": str(exc)[:140]})
        return {"checked": checked, "signals": signals, "early": early, "watchlist": watchlist, "high_volatility": high_volatility, "skipped": skipped}

    async def _signal_symbols(self) -> list[str]:
        base_symbols = signal_symbols()
        if not settings.telegram_dynamic_market_discovery_enabled:
            return base_symbols
        hot_symbols = await self.market_service.fetch_hot_usdt_symbols(limit=settings.telegram_hot_symbol_count)
        combined: list[str] = []
        for symbol in [*base_symbols, *hot_symbols]:
            if symbol not in combined:
                combined.append(symbol)
            if len(combined) >= settings.telegram_max_scan_symbols:
                break
        return combined

    async def _send_no_setup_once(self, credentials: TelegramCredentials) -> dict[str, Any]:
        redis = await get_redis()
        key = "telegram:no_setup_message:cooldown"
        if await redis.get(key):
            return {"status": "skipped", "reason": "no-setup message cooldown"}
        delivery = await send_telegram_message(
            "No clean high-quality setup right now. Vypexrock is waiting for a stronger 4H setup with 1H confirmation.",
            chat_id=credentials.chat_id,
            bot_token=credentials.bot_token,
        )
        await redis.setex(key, 6 * 60 * 60, "1")
        return delivery

    async def _send_market_status_if_due(self, credentials: TelegramCredentials, *, force: bool = False) -> dict[str, Any]:
        redis = await get_redis()
        key = "telegram:market_status:cooldown"
        if not force and await redis.get(key):
            return {"status": "skipped", "reason": "market status cooldown"}
        delivery = await send_telegram_message(
            "\n".join(
                [
                    "VYPEXROCK MARKET STATUS",
                    "",
                    "No high-quality trade setup right now.",
                    "",
                    "Watching:",
                    "- BTC, ETH, SOL and majors",
                    "- Hot altcoins and meme futures",
                    "- New high-volume movers",
                    "- Breakout/retest candidates",
                    "",
                    "Best current condition: waiting for clean 15m entry + 1H confirmation + 4H trend alignment.",
                    "",
                    "Do not force trades.",
                ]
            ),
            chat_id=credentials.chat_id,
            bot_token=credentials.bot_token,
        )
        await redis.setex(key, settings.telegram_market_status_interval_minutes * 60, "1")
        await self._record_log(kind="market_status", status=str(delivery.get("status")), detail="Hourly no-setup market status.", message_id=delivery.get("message_id"))
        return delivery

    async def _passes_watchlist_cooldown(self, signal: TelegramSignal) -> bool:
        redis = await get_redis()
        return not await redis.get(watchlist_cooldown_key(signal.symbol, signal.timeframe, signal.bias))

    async def _record_watchlist_sent(self, signal: TelegramSignal, delivery: dict[str, Any]) -> None:
        redis = await get_redis()
        await redis.setex(
            watchlist_cooldown_key(signal.symbol, signal.timeframe, signal.bias),
            settings.telegram_watchlist_cooldown_minutes * 60,
            json.dumps({"confidence": signal.confidence, "sentAt": datetime.now(UTC).isoformat()}),
        )
        await self._record_log(
            kind="watchlist",
            status=str(delivery.get("status")),
            detail=f"{signal.symbol} {signal.timeframe} forming {signal.bias} setup {signal.confidence}%",
            message_id=delivery.get("message_id"),
            symbol=signal.symbol,
        )

    async def _evaluate_open_signal(self, signal_id: str, payload: dict[str, Any], credentials: TelegramCredentials) -> int:
        redis = await get_redis()
        symbol = str(payload["symbol"])
        timeframe = str(payload.get("timeframe", settings.telegram_signal_timeframe)).lower()
        expires_at_raw = payload.get("expiresAt") or payload.get("expires_at")
        if not expires_at_raw:
            expires_at_raw = (datetime.fromisoformat(str(payload.get("sentAt"))) + timedelta(hours=settings.telegram_signal_expiry_hours)).isoformat()
        expired = datetime.now(UTC) >= datetime.fromisoformat(str(expires_at_raw))
        if expired:
            await redis.hdel("telegram_active_signals", signal_id)
            await self._record_log(kind="signal_expired", status="cleaned", detail=f"{symbol} expired before price refresh", symbol=symbol)
            return 0

        candles = await self.market_service.fetch_candles(symbol, timeframe, limit=4)
        if not candles:
            return 0
        latest = candles[-1]
        high = float(latest["high"])
        low = float(latest["low"])
        close = float(latest["close"])
        direction = str(payload["direction"]).lower()
        entry = float(payload["entry"])
        stop_loss = float(payload["stop_loss"])
        take_profits = [float(item) for item in payload["take_profits"]]
        hit_levels = set(payload.get("hitLevels", []))
        entered = bool(payload.get("entered", False))
        followups = 0

        entry_hit = high >= entry if "long" in direction else low <= entry
        invalid_before_entry = low <= stop_loss if "long" in direction else high >= stop_loss
        if not entered:
            if invalid_before_entry and not entry_hit:
                pnl = 0.0
                delivery = await send_telegram_message(
                    format_signal_followup_v2(symbol, "Invalidated before entry", pnl, close),
                    chat_id=credentials.chat_id,
                    bot_token=credentials.bot_token,
                )
                await redis.hdel("telegram_active_signals", signal_id)
                await self._record_log(kind="signal_invalidated", status=str(delivery.get("status")), detail=f"{symbol} invalidated before entry", message_id=delivery.get("message_id"), symbol=symbol)
                return 1
            if not entry_hit:
                payload["hitLevels"] = sorted(hit_levels)
                await redis.hset("telegram_active_signals", signal_id, json.dumps(payload))
                return 0
            payload["entered"] = True

        stop_hit = low <= stop_loss if "long" in direction else high >= stop_loss
        if stop_hit:
            pnl = percent_change(stop_loss, entry, "long" in direction)
            delivery = await send_telegram_message(
                format_signal_followup_v2(symbol, "Stop loss hit", pnl, stop_loss),
                chat_id=credentials.chat_id,
                bot_token=credentials.bot_token,
            )
            await redis.hdel("telegram_active_signals", signal_id)
            await self._record_log(kind="signal_result", status=str(delivery.get("status")), detail=f"{symbol} SL hit {pnl:+.2f}%", message_id=delivery.get("message_id"), symbol=symbol)
            return 1

        for index, target in enumerate(take_profits, start=1):
            level = f"TP{index}"
            target_hit = high >= target if "long" in direction else low <= target
            if target_hit and level not in hit_levels:
                pnl = percent_change(target, entry, "long" in direction)
                delivery = await send_telegram_message(
                    format_signal_followup_v2(symbol, f"{level} hit", pnl, target),
                    chat_id=credentials.chat_id,
                    bot_token=credentials.bot_token,
                )
                hit_levels.add(level)
                followups += 1
                await self._record_log(kind="signal_result", status=str(delivery.get("status")), detail=f"{symbol} {level} hit {pnl:+.2f}%", message_id=delivery.get("message_id"), symbol=symbol)

        if "TP3" in hit_levels:
            await redis.hdel("telegram_active_signals", signal_id)
            return followups

        if expired:
            pnl = percent_change(close, entry, "long" in direction)
            delivery = await send_telegram_message(
                format_signal_followup_v2(symbol, "Signal expired after 24h", pnl, close),
                chat_id=credentials.chat_id,
                bot_token=credentials.bot_token,
            )
            await redis.hdel("telegram_active_signals", signal_id)
            await self._record_log(kind="signal_result", status=str(delivery.get("status")), detail=f"{symbol} expired {pnl:+.2f}%", message_id=delivery.get("message_id"), symbol=symbol)
            return followups + 1

        if followups == 0 and should_send_running_update(payload):
            pnl = percent_change(close, entry, "long" in direction)
            delivery = await send_telegram_message(
                format_signal_followup_v2(symbol, "Trade still running", pnl, close),
                chat_id=credentials.chat_id,
                bot_token=credentials.bot_token,
            )
            payload["lastRunningUpdateAt"] = datetime.now(UTC).isoformat()
            followups += 1 if delivery.get("status") == "sent" else 0
            await self._record_log(kind="signal_running", status=str(delivery.get("status")), detail=f"{symbol} still running {pnl:+.2f}%", message_id=delivery.get("message_id"), symbol=symbol)

        payload["hitLevels"] = sorted(hit_levels)
        await redis.hset("telegram_active_signals", signal_id, json.dumps(payload))
        return followups

    async def _fetch_market_rows(self) -> list[dict]:
        dashboard_rows = await self.market_service.fetch_dashboard()
        by_symbol = {item["symbol"]: item for item in dashboard_rows}
        symbols = market_update_symbols()
        if settings.telegram_dynamic_market_discovery_enabled:
            for symbol in await self.market_service.fetch_hot_usdt_symbols(limit=settings.telegram_hot_symbol_count):
                if symbol not in symbols:
                    symbols.append(symbol)
        missing = [symbol for symbol in symbols if symbol not in by_symbol]
        if missing:
            for item in await self.market_service.fetch_rest_tickers(missing):
                by_symbol[item["symbol"]] = item
        return [by_symbol[symbol] for symbol in symbols if symbol in by_symbol]

    def _build_market_report(self, rows: list[dict]) -> str:
        now = datetime.now(UTC)
        changes = [float(row.get("change_24h", 0)) for row in rows]
        average_change = sum(changes) / len(changes) if changes else 0
        green_count = sum(1 for change in changes if change > 0)
        mood = market_mood(average_change, green_count, len(changes))
        lines = [
            "Vypexrock Hourly Market Pulse",
            f"{now.date().isoformat()} | {now.strftime('%H:%M')} UTC",
            "",
            f"Top {len(rows)} Live Assets",
            "",
        ]
        for index, row in enumerate(rows, start=1):
            price = float(row.get("price", 0))
            change = float(row.get("change_24h", 0))
            lines.append(f"{index}. {row['symbol']} - {format_price(price)} | {change:+.2f}%")
        lines.extend(
            [
                "",
                f"Market mood: {mood}.",
                "",
                "Probability-based data, not financial advice.",
            ]
        )
        return "\n".join(lines)

    async def _passes_cooldown(self, signal: TelegramSignal) -> bool:
        redis = await get_redis()
        key = cooldown_key(signal.symbol, signal.timeframe)
        payload = await redis.get(key)
        if not payload:
            return True

        previous = json.loads(payload)
        previous_direction = previous.get("direction")
        previous_confidence = int(previous.get("confidence", 0))
        if previous_direction != signal.direction:
            return True
        return signal.confidence >= previous_confidence + 10

    async def _record_sent(self, signal: TelegramSignal, delivery: dict[str, Any]) -> None:
        redis = await get_redis()
        now = datetime.now(UTC).isoformat()
        signal_id = f"{signal.symbol}:{signal.timeframe}:{signal.direction}:{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}"
        payload = {
            **asdict(signal),
            "id": signal_id,
            "sentAt": now,
            "expiresAt": signal.expires_at,
            "hitLevels": [],
            "entered": False,
            "telegramMessageId": delivery.get("message_id"),
        }
        await redis.setex(
            cooldown_key(signal.symbol, signal.timeframe),
            settings.telegram_signal_cooldown_minutes * 60,
            json.dumps({"direction": signal.direction, "confidence": signal.confidence, "sentAt": now}),
        )
        await redis.hset("telegram_active_signals", signal_id, json.dumps(payload))
        await redis.lpush("telegram_signal_history", json.dumps(payload))
        await redis.ltrim("telegram_signal_history", 0, 99)

    async def _record_log(
        self,
        *,
        kind: str,
        status: str,
        detail: str,
        message_id: Any = None,
        symbol: str | None = None,
    ) -> None:
        redis = await get_redis()
        payload = {
            "type": kind,
            "status": status,
            "detail": detail,
            "message_id": message_id,
            "symbol": symbol,
            "sent_at": datetime.now(UTC).isoformat(),
        }
        await redis.lpush("telegram_delivery_logs", json.dumps(payload))
        await redis.ltrim("telegram_delivery_logs", 0, 49)

    async def read_delivery_logs(self, limit: int = 8) -> list[dict[str, Any]]:
        redis = await get_redis()
        rows = await redis.lrange("telegram_delivery_logs", 0, max(0, limit - 1))
        logs: list[dict[str, Any]] = []
        for row in rows:
            try:
                logs.append(json.loads(row))
            except json.JSONDecodeError:
                continue
        return logs


def signal_symbols() -> list[str]:
    return [symbol.strip().upper() for symbol in settings.telegram_signal_symbols.split(",") if symbol.strip()]


def signal_timeframes() -> list[str]:
    configured = getattr(settings, "telegram_signal_timeframes", "")
    values = [item.strip().lower() for item in configured.split(",") if item.strip()]
    return values or [settings.telegram_signal_timeframe.lower()]


def market_update_symbols() -> list[str]:
    return [symbol.strip().upper() for symbol in settings.telegram_market_update_symbols.split(",") if symbol.strip()]


def top_market_rows(rows: list[dict], limit: int) -> list[dict]:
    return sorted(
        rows,
        key=lambda row: (abs(float(row.get("change_24h", 0))), float(row.get("volume_24h", 0))),
        reverse=True,
    )[: max(1, limit)]


def best_signal_candidate(candidates: list[tuple[TelegramSignal, list[dict]]]) -> tuple[TelegramSignal, list[dict]] | None:
    if not candidates:
        return None
    return max(candidates, key=lambda item: signal_score(item[0]))


def best_watchlist_candidate(candidates: list[tuple[TelegramSignal, list[dict]]]) -> tuple[TelegramSignal, list[dict]] | None:
    if not candidates:
        return None
    return max(candidates, key=lambda item: signal_score(item[0]))


def signal_score(signal: TelegramSignal) -> float:
    rr_bonus = 8 if signal.risk_reward >= 2 else 0
    confirmation_bonus = 8 if signal.confirmation_state in {"breakout", "reclaim", "continuation"} else 0
    volume_bonus = min(max(signal.volume_ratio - 1, 0), 1.5) * 8
    return signal.confidence + signal.quality_score * 0.35 + min(signal.risk_reward, 4.0) * 5 + volume_bonus + rr_bonus + confirmation_bonus


def cooldown_key(symbol: str, timeframe: str) -> str:
    return f"telegram_signal:cooldown:{symbol}:{timeframe.upper()}"


def watchlist_cooldown_key(symbol: str, timeframe: str, bias: str) -> str:
    return f"telegram_watchlist:cooldown:{symbol}:{timeframe.upper()}:{bias}"


def average_true_range_local(candles: list[dict], period: int = 14) -> float:
    if len(candles) < period + 1:
        return 0.0
    ranges: list[float] = []
    for index in range(1, len(candles)):
        high = float(candles[index]["high"])
        low = float(candles[index]["low"])
        previous_close = float(candles[index - 1]["close"])
        ranges.append(max(high - low, abs(high - previous_close), abs(low - previous_close)))
    return sum(ranges[-period:]) / period


def recent_volume_ratio(candles: list[dict], period: int = 30) -> float:
    if len(candles) < period + 2:
        return 0.0
    recent = float(candles[-1].get("volume", 0))
    baseline_values = [float(item.get("volume", 0)) for item in candles[-period - 1 : -1]]
    baseline = sum(baseline_values) / len(baseline_values) if baseline_values else 0
    return recent / baseline if baseline > 0 else 0.0


def ema_local(values: list[float], period: int) -> list[float]:
    if not values:
        return []
    multiplier = 2 / (period + 1)
    current = values[0]
    result: list[float] = []
    for value in values:
        current = (value - current) * multiplier + current
        result.append(current)
    return result


def rsi_local(values: list[float], period: int = 14) -> float:
    if len(values) < period + 1:
        return 50.0
    gains = []
    losses = []
    for index in range(-period, 0):
        delta = values[index] - values[index - 1]
        gains.append(max(delta, 0))
        losses.append(abs(min(delta, 0)))
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def vwap_local(candles: list[dict]) -> float:
    total_volume_price = 0.0
    total_volume = 0.0
    fallback_prices: list[float] = []
    for candle in candles:
        high = float(candle["high"])
        low = float(candle["low"])
        close = float(candle["close"])
        volume = float(candle.get("volume", 0))
        typical = (high + low + close) / 3
        fallback_prices.append(typical)
        total_volume_price += typical * volume
        total_volume += volume
    if total_volume > 0:
        return total_volume_price / total_volume
    return sum(fallback_prices) / len(fallback_prices) if fallback_prices else 0.0


def macd_pair(values: list[float]) -> tuple[float, float]:
    if len(values) < 35:
        return 0.0, 0.0
    ema12 = ema_local(values, 12)
    ema26 = ema_local(values, 26)
    macd_values = [fast - slow for fast, slow in zip(ema12[-len(ema26) :], ema26)]
    signal_values = ema_local(macd_values, 9)
    return macd_values[-1], signal_values[-1]


def q_trend_state(values: list[float]) -> str:
    if len(values) < 40:
        return "mixed"
    ema8 = ema_local(values, 8)
    ema21 = ema_local(values, 21)
    slope = ema8[-1] - ema8[-6]
    if ema8[-1] > ema21[-1] and slope > 0:
        return "long"
    if ema8[-1] < ema21[-1] and slope < 0:
        return "short"
    return "mixed"


def supertrend_state(candles: list[dict], atr: float, multiplier: float = 2.2) -> str:
    if len(candles) < 20:
        return "mixed"
    last = candles[-1]
    previous = candles[-2]
    hl2 = (float(previous["high"]) + float(previous["low"])) / 2
    upper_band = hl2 + atr * multiplier
    lower_band = hl2 - atr * multiplier
    close = float(last["close"])
    if close > lower_band and close > float(previous["close"]):
        return "long"
    if close < upper_band and close < float(previous["close"]):
        return "short"
    return "mixed"


def liquidity_sweep_state(candles: list[dict], atr: float) -> str:
    if len(candles) < 25:
        return "none"
    last = candles[-1]
    previous = candles[-24:-1]
    previous_high = max(float(item["high"]) for item in previous)
    previous_low = min(float(item["low"]) for item in previous)
    high = float(last["high"])
    low = float(last["low"])
    close = float(last["close"])
    open_price = float(last["open"])
    if low < previous_low - atr * 0.08 and close > previous_low and close > open_price:
        return "bullish_sweep"
    if high > previous_high + atr * 0.08 and close < previous_high and close < open_price:
        return "bearish_sweep"
    return "none"


def bos_choch_state(candles: list[dict], bias: str) -> str:
    if len(candles) < 45:
        return "none"
    structure = market_structure(candles)
    highs = structure.get("swing_highs", [])
    lows = structure.get("swing_lows", [])
    close = float(candles[-1]["close"])
    if bias == "long" and highs:
        if close > float(highs[-1]):
            return "bos"
        if structure.get("trend") == "LH/LL" and len(highs) >= 2 and close > float(highs[-2]):
            return "choch"
    if bias == "short" and lows:
        if close < float(lows[-1]):
            return "bos"
        if structure.get("trend") == "HH/HL" and len(lows) >= 2 and close < float(lows[-2]):
            return "choch"
    return "none"


def swing_points(candles: list[dict], lookback: int = 3) -> tuple[list[tuple[int, float]], list[tuple[int, float]]]:
    highs: list[tuple[int, float]] = []
    lows: list[tuple[int, float]] = []
    if len(candles) < lookback * 2 + 3:
        return highs, lows
    for index in range(lookback, len(candles) - lookback):
        high = float(candles[index]["high"])
        low = float(candles[index]["low"])
        left = candles[index - lookback : index]
        right = candles[index + 1 : index + lookback + 1]
        if high >= max(float(item["high"]) for item in [*left, *right]):
            highs.append((index, high))
        if low <= min(float(item["low"]) for item in [*left, *right]):
            lows.append((index, low))
    return highs[-6:], lows[-6:]


def market_structure(candles: list[dict]) -> dict[str, Any]:
    highs, lows = swing_points(candles[-90:])
    last_highs = [value for _, value in highs[-3:]]
    last_lows = [value for _, value in lows[-3:]]
    trend = "range"
    if len(last_highs) >= 2 and len(last_lows) >= 2:
        if last_highs[-1] > last_highs[-2] and last_lows[-1] > last_lows[-2]:
            trend = "HH/HL"
        elif last_highs[-1] < last_highs[-2] and last_lows[-1] < last_lows[-2]:
            trend = "LH/LL"
    return {
        "trend": trend,
        "last_swing_high": last_highs[-1] if last_highs else None,
        "last_swing_low": last_lows[-1] if last_lows else None,
        "swing_highs": last_highs,
        "swing_lows": last_lows,
    }


def trend_bias(candles: list[dict]) -> str:
    closes = [float(item["close"]) for item in candles]
    ema20 = ema_local(closes, 20)[-1]
    ema50 = ema_local(closes, 50)[-1]
    price = closes[-1]
    if ema20 > ema50 and price > ema20:
        return "bullish"
    if ema20 < ema50 and price < ema20:
        return "bearish"
    return "mixed"


def advanced_indicator_profile(candles: list[dict], bias: str, atr: float) -> dict[str, Any]:
    if len(candles) < 60 or bias not in {"long", "short"}:
        return {"score": -8, "notes": ["insufficient advanced indicator history"]}

    closes = [float(item["close"]) for item in candles]
    highs = [float(item["high"]) for item in candles]
    lows = [float(item["low"]) for item in candles]
    price = closes[-1]
    ema8 = ema_local(closes, 8)[-1]
    ema20 = ema_local(closes, 20)[-1]
    ema50 = ema_local(closes, 50)[-1]
    vwap = vwap_local(candles[-60:])
    macd_line, macd_signal_line = macd_pair(closes)
    q_trend = q_trend_state(closes)
    supertrend = supertrend_state(candles, atr)
    sweep = liquidity_sweep_state(candles, atr)
    structure_break = bos_choch_state(candles, bias)
    previous_high = max(highs[-35:-1])
    previous_low = min(lows[-35:-1])
    volume_ratio = recent_volume_ratio(candles, 30)

    score = 0
    notes: list[str] = []
    if bias == "long":
        if ema8 > ema20 > ema50 and price > ema8:
            score += 10
            notes.append("EMA trend stack bullish")
        elif ema20 > ema50 and price > ema20:
            score += 5
            notes.append("EMA trend supports long")
        else:
            score -= 10
            notes.append("EMA stack not aligned")
        if price > vwap:
            score += 5
            notes.append("above VWAP")
        else:
            score -= 5
            notes.append("below VWAP")
        if macd_line > macd_signal_line:
            score += 5
            notes.append("MACD bullish")
        else:
            score -= 5
            notes.append("MACD not confirmed")
        if q_trend == "long":
            score += 5
            notes.append("Q_Trend bullish")
        if supertrend == "long":
            score += 5
            notes.append("Supertrend bullish")
        if sweep == "bullish_sweep":
            score += 8
            notes.append("liquidity sweep recovery")
        if structure_break == "bos":
            score += 8
            notes.append("BOS above resistance")
        elif structure_break == "choch":
            score += 5
            notes.append("CHoCH forming")
        if 0 <= previous_high - price <= atr * 0.45 and volume_ratio >= 0.9:
            score += 6
            notes.append("near breakout zone")
    else:
        if ema8 < ema20 < ema50 and price < ema8:
            score += 10
            notes.append("EMA trend stack bearish")
        elif ema20 < ema50 and price < ema20:
            score += 5
            notes.append("EMA trend supports short")
        else:
            score -= 10
            notes.append("EMA stack not aligned")
        if price < vwap:
            score += 5
            notes.append("below VWAP")
        else:
            score -= 5
            notes.append("above VWAP")
        if macd_line < macd_signal_line:
            score += 5
            notes.append("MACD bearish")
        else:
            score -= 5
            notes.append("MACD not confirmed")
        if q_trend == "short":
            score += 5
            notes.append("Q_Trend bearish")
        if supertrend == "short":
            score += 5
            notes.append("Supertrend bearish")
        if sweep == "bearish_sweep":
            score += 8
            notes.append("liquidity sweep rejection")
        if structure_break == "bos":
            score += 8
            notes.append("BOS below support")
        elif structure_break == "choch":
            score += 5
            notes.append("CHoCH forming")
        if 0 <= price - previous_low <= atr * 0.45 and volume_ratio >= 0.9:
            score += 6
            notes.append("near breakdown zone")
    return {"score": score, "notes": notes}


def tactical_bias_from_candles(candles: list[dict]) -> str:
    closes = [float(item["close"]) for item in candles]
    if len(closes) < 55:
        return "long" if closes[-1] >= closes[0] else "short"
    ema20 = ema_local(closes, 20)[-1]
    ema50 = ema_local(closes, 50)[-1]
    recent_momentum = closes[-1] - closes[-8]
    session_momentum = closes[-1] - closes[-24]
    rsi = rsi_local(closes)
    score = 0
    score += 2 if closes[-1] > ema20 else -2
    score += 2 if ema20 > ema50 else -2
    score += 1 if recent_momentum > 0 else -1
    score += 1 if session_momentum > 0 else -1
    score += 1 if rsi >= 52 else -1 if rsi <= 48 else 0
    return "long" if score >= 0 else "short"


def meme_momentum_score(candles: list[dict], *, symbol: str, bias: str) -> dict[str, Any]:
    """Score explosive alt/meme momentum with volume expansion — penalize chase entries."""
    notes: list[str] = []
    score = 0
    if bias not in {"long", "short"} or len(candles) < 40:
        return {"score": 0, "notes": notes}
    if not symbol.endswith("USDT") or symbol in {"BTCUSDT", "ETHUSDT", "BNBUSDT"}:
        return {"score": 0, "notes": notes}

    closes = [float(item["close"]) for item in candles]
    volume_ratio = recent_volume_ratio(candles, 20)
    change_6 = ((closes[-1] - closes[-7]) / closes[-7] * 100) if len(closes) >= 7 and closes[-7] else 0
    change_24 = ((closes[-1] - closes[-25]) / closes[-25] * 100) if len(closes) >= 25 and closes[-25] else 0
    atr = average_true_range_local(candles) or max(closes[-1] * 0.01, 1e-8)
    last_range = float(candles[-1]["high"]) - float(candles[-1]["low"])
    range_expansion = last_range >= atr * 1.35

    if volume_ratio >= 2.2 and abs(change_6) >= 4:
        score += 10 if (bias == "long" and change_6 > 0) or (bias == "short" and change_6 < 0) else -14
        notes.append("meme-tier volume surge")
    elif volume_ratio >= 1.6 and abs(change_24) >= 8:
        score += 6 if (bias == "long" and change_24 > 0) or (bias == "short" and change_24 < 0) else -10
        notes.append("high-beta momentum extension")

    if range_expansion and abs(change_6) > 6:
        score -= 12
        notes.append("late chase after range expansion")

    if is_huge_impulse_without_pullback(candles):
        score -= 8
        notes.append("meme impulse without pullback")

    return {"score": score, "notes": notes}


def signal_quality_score(
    *,
    symbol: str = "",
    candles: list[dict],
    bias: str,
    base_confidence: int,
    risk_reward: float,
    volume_ratio: float,
    atr: float,
    entry: float,
    stop_loss: float,
    take_profits: tuple[float, float, float],
) -> dict[str, Any]:
    notes: list[str] = []
    score = base_confidence
    structure = market_structure(candles)
    structure_label = str(structure["trend"])
    trend = trend_bias(candles)
    closes = [float(item["close"]) for item in candles]
    rsi = rsi_local(closes)
    advanced = advanced_indicator_profile(candles, bias, atr)
    score += int(advanced["score"])
    notes.extend(str(note) for note in advanced["notes"])

    if bias == "long" and (structure_label == "HH/HL" or trend == "bullish"):
        score += 8
        notes.append("bullish trend/structure")
    elif bias == "short" and (structure_label == "LH/LL" or trend == "bearish"):
        score += 8
        notes.append("bearish trend/structure")
    else:
        score -= 22
        notes.append("trend/structure not aligned")

    if volume_ratio <= 0.01:
        score -= 24
        notes.append("volume data unreliable")
    elif volume_ratio >= 1.45:
        score += 9
        notes.append("relative volume expansion")
    elif volume_ratio >= 1.15:
        score += 7
        notes.append("strong volume")
    elif volume_ratio >= 0.95:
        score += 3
        notes.append("acceptable volume")
    else:
        score -= 18
        notes.append("weak volume")

    if bias == "long" and rsi >= 72:
        score -= 10
        notes.append("RSI overbought; pullback risk")
    elif bias == "short" and rsi <= 28:
        score -= 10
        notes.append("RSI oversold; bounce risk")

    if is_messy_sideways(candles):
        score -= 24
        notes.append("messy sideways market")

    if is_huge_impulse_without_pullback(candles):
        score -= 18
        notes.append("too late after impulse candle")

    sudden = sudden_opportunity_score(candles, bias, atr)
    score += int(sudden["score"])
    notes.extend(str(note) for note in sudden["notes"])

    meme = meme_momentum_score(candles, symbol=symbol, bias=bias)
    score += int(meme["score"])
    notes.extend(str(note) for note in meme["notes"])

    if risk_reward >= 2.0:
        score += 5
        notes.append("2R+ reward profile")
    elif risk_reward < settings.telegram_signal_min_risk_reward:
        score -= 20
        notes.append(f"risk/reward below {settings.telegram_signal_min_risk_reward:.1f}R")

    conflict = has_level_conflict(candles, bias, entry, stop_loss, take_profits, atr)
    if conflict:
        score -= 16
        notes.append("nearby level conflict")
    else:
        score += 4
        notes.append("clear room to target")

    if looks_like_fake_breakout(candles, bias, atr):
        score -= 22
        notes.append("possible fake breakout")

    risk_distance = abs(entry - stop_loss)
    if risk_distance < atr * 0.75:
        score -= 10
        notes.append("stop too tight for 4H volatility")

    return {
        "score": max(0, min(96, int(score))),
        "structure_label": structure_label if structure_label != "range" else trend,
        "notes": notes,
    }


def sudden_opportunity_score(candles: list[dict], bias: str, atr: float) -> dict[str, Any]:
    if len(candles) < 35 or bias not in {"long", "short"}:
        return {"score": -8, "notes": ["no sudden directional edge"]}
    last = candles[-1]
    previous = candles[-25:-1]
    close = float(last["close"])
    open_price = float(last["open"])
    high = float(last["high"])
    low = float(last["low"])
    candle_range = max(high - low, 1e-8)
    body = abs(close - open_price)
    previous_high = max(float(item["high"]) for item in previous)
    previous_low = min(float(item["low"]) for item in previous)
    upper_wick_ratio = (high - max(open_price, close)) / candle_range
    lower_wick_ratio = (min(open_price, close) - low) / candle_range
    volume_ratio = recent_volume_ratio(candles, 25)
    closes = [float(item["close"]) for item in candles]
    rsi_now = rsi_local(closes)
    rsi_prev = rsi_local(closes[:-3]) if len(closes) > 25 else rsi_now
    notes: list[str] = []
    score = 0

    if bias == "long":
        breakout = close > previous_high and body >= atr * 0.35
        rejection = low <= previous_low + atr * 0.25 and lower_wick_ratio > 0.42 and close > open_price
        momentum_shift = rsi_now > 52 and rsi_now - rsi_prev >= 3
        approaching_level = 0 <= previous_high - close <= atr * 0.35
        if breakout:
            score += 14
            notes.append("fresh upside breakout")
        if rejection:
            score += 12
            notes.append("fast rejection from support")
        if momentum_shift:
            score += 7
            notes.append("RSI momentum accelerating")
        if approaching_level:
            score += 4
            notes.append("approaching breakout level")
    else:
        breakdown = close < previous_low and body >= atr * 0.35
        rejection = high >= previous_high - atr * 0.25 and upper_wick_ratio > 0.42 and close < open_price
        momentum_shift = rsi_now < 48 and rsi_prev - rsi_now >= 3
        approaching_level = 0 <= close - previous_low <= atr * 0.35
        if breakdown:
            score += 14
            notes.append("fresh downside breakdown")
        if rejection:
            score += 12
            notes.append("fast rejection from resistance")
        if momentum_shift:
            score += 7
            notes.append("RSI momentum rolling over")
        if approaching_level:
            score += 4
            notes.append("approaching breakdown level")

    if volume_ratio >= 1.5:
        score += 8
        notes.append("volume spike")
    elif volume_ratio < 0.75:
        score -= 6
        notes.append("thin volume")
    if not notes:
        score -= 8
        notes.append("no sudden opportunity trigger")
    return {"score": score, "notes": notes}


def confirmation_check(candles: list[dict], bias: str, timeframe_label: str = "1D") -> ConfirmationResult:
    if bias not in {"long", "short"}:
        return ConfirmationResult(False, -30, f"{timeframe_label} is neutral; no directional confirmation.", "failed", 0.0, (f"{timeframe_label} neutral",))

    closes = [float(item["close"]) for item in candles]
    ema20 = ema_local(closes, 20)[-1]
    ema50 = ema_local(closes, 50)[-1]
    rsi = rsi_local(closes)
    atr = average_true_range_local(candles) or max(closes[-1] * 0.01, 1e-8)
    volume_ratio = recent_volume_ratio(candles)
    last = candles[-1]
    previous = candles[-18:-1]
    close = float(last["close"])
    open_price = float(last["open"])
    high = float(last["high"])
    low = float(last["low"])
    previous_high = max(float(item["high"]) for item in previous)
    previous_low = min(float(item["low"]) for item in previous)
    body = abs(close - open_price)
    candle_range = max(high - low, 1e-8)
    upper_wick_ratio = (high - max(open_price, close)) / candle_range
    lower_wick_ratio = (min(open_price, close) - low) / candle_range
    momentum_6 = ((close - closes[-7]) / closes[-7] * 100) if len(closes) >= 7 and closes[-7] else 0
    notes: list[str] = []

    if bias == "long":
        bullish_momentum = ema20 > ema50 and close > ema20 and rsi >= 50 and momentum_6 > 0
        breakout = close > previous_high and volume_ratio >= 1.0
        reclaim = low <= ema20 <= close and close > open_price
        rejection = upper_wick_ratio > 0.45 and body < atr * 0.45
        bearish_reversal = close < open_price and lower_wick_ratio < 0.25 and volume_ratio >= 1.15
        if rejection or bearish_reversal:
            return ConfirmationResult(False, -24, f"{timeframe_label} shows rejection or bearish reversal against the long setup.", "rejection", volume_ratio, (f"{timeframe_label} rejection",))
        if breakout:
            notes.append(f"{timeframe_label} breakout confirmation")
            return ConfirmationResult(True, 10, f"{timeframe_label} broke above local resistance with supportive volume.", "breakout", volume_ratio, tuple(notes))
        if reclaim:
            notes.append(f"{timeframe_label} reclaim confirmation")
            return ConfirmationResult(True, 8, f"{timeframe_label} reclaimed EMA20 after a controlled pullback.", "reclaim", volume_ratio, tuple(notes))
        if bullish_momentum and volume_ratio >= 0.9:
            notes.append(f"{timeframe_label} bullish continuation")
            return ConfirmationResult(True, 6, f"{timeframe_label} momentum remains bullish without reversal pressure.", "continuation", volume_ratio, tuple(notes))
        return ConfirmationResult(False, -18, f"{timeframe_label} does not confirm the long setup yet.", "unclear", volume_ratio, (f"{timeframe_label} unclear",))

    bearish_momentum = ema20 < ema50 and close < ema20 and rsi <= 50 and momentum_6 < 0
    breakdown = close < previous_low and volume_ratio >= 1.0
    rejection = high >= ema20 >= close and close < open_price
    bullish_recovery = close > open_price and upper_wick_ratio < 0.25 and volume_ratio >= 1.15
    lower_rejection = lower_wick_ratio > 0.45 and body < atr * 0.45
    if bullish_recovery or lower_rejection:
        return ConfirmationResult(False, -24, f"{timeframe_label} shows bullish recovery or rejection against the short setup.", "rejection", volume_ratio, (f"{timeframe_label} bullish recovery",))
    if breakdown:
        notes.append(f"{timeframe_label} breakdown confirmation")
        return ConfirmationResult(True, 10, f"{timeframe_label} broke below local support with supportive volume.", "breakout", volume_ratio, tuple(notes))
    if rejection:
        notes.append(f"{timeframe_label} rejection confirmation")
        return ConfirmationResult(True, 8, f"{timeframe_label} rejected EMA20 and resumed lower.", "reclaim", volume_ratio, tuple(notes))
    if bearish_momentum and volume_ratio >= 0.9:
        notes.append(f"{timeframe_label} bearish continuation")
        return ConfirmationResult(True, 6, f"{timeframe_label} momentum remains bearish without recovery pressure.", "continuation", volume_ratio, tuple(notes))
    return ConfirmationResult(False, -18, f"{timeframe_label} does not confirm the short setup yet.", "unclear", volume_ratio, (f"{timeframe_label} unclear",))


def trend_filter_check(candles: list[dict], bias: str, timeframe_label: str = "1D") -> ConfirmationResult:
    if bias not in {"long", "short"}:
        return ConfirmationResult(False, -18, f"{timeframe_label} trend is neutral.", "failed", 0.0, (f"{timeframe_label} neutral",))
    closes = [float(item["close"]) for item in candles]
    ema20 = ema_local(closes, 20)[-1]
    ema50 = ema_local(closes, 50)[-1]
    rsi = rsi_local(closes)
    price = closes[-1]
    volume_ratio = recent_volume_ratio(candles)
    if bias == "long":
        aligned = ema20 >= ema50 and price >= ema20 and rsi >= 48
        if aligned:
            return ConfirmationResult(True, 6, f"{timeframe_label} trend supports long bias.", "trend_aligned", volume_ratio, (f"{timeframe_label} long trend filter",))
        if price >= ema50 and rsi >= 45:
            return ConfirmationResult(True, 1, f"{timeframe_label} is not bearish, but trend support is moderate.", "trend_mixed", volume_ratio, (f"{timeframe_label} mixed trend",))
        return ConfirmationResult(False, -16, f"{timeframe_label} trend conflicts with long bias.", "failed", volume_ratio, (f"{timeframe_label} trend conflict",))
    aligned = ema20 <= ema50 and price <= ema20 and rsi <= 52
    if aligned:
        return ConfirmationResult(True, 6, f"{timeframe_label} trend supports short bias.", "trend_aligned", volume_ratio, (f"{timeframe_label} short trend filter",))
    if price <= ema50 and rsi <= 55:
        return ConfirmationResult(True, 1, f"{timeframe_label} is not bullish, but trend support is moderate.", "trend_mixed", volume_ratio, (f"{timeframe_label} mixed trend",))
    return ConfirmationResult(False, -16, f"{timeframe_label} trend conflicts with short bias.", "failed", volume_ratio, (f"{timeframe_label} trend conflict",))


def entry_timing_check(candles: list[dict], bias: str, timeframe_label: str = "5M") -> ConfirmationResult:
    if bias not in {"long", "short"}:
        return ConfirmationResult(False, -12, f"{timeframe_label} has no directional entry context.", "failed", 0.0, (f"{timeframe_label} no entry bias",))
    if len(candles) < 45:
        return ConfirmationResult(False, -10, f"{timeframe_label} has insufficient fast-entry history.", "failed", 0.0, (f"{timeframe_label} insufficient history",))

    closes = [float(item["close"]) for item in candles]
    ema8 = ema_local(closes, 8)[-1]
    ema20 = ema_local(closes, 20)[-1]
    rsi = rsi_local(closes)
    atr = average_true_range_local(candles) or max(closes[-1] * 0.006, 1e-8)
    volume_ratio = recent_volume_ratio(candles, 24)
    last = candles[-1]
    previous = candles[-22:-1]
    close = float(last["close"])
    open_price = float(last["open"])
    high = float(last["high"])
    low = float(last["low"])
    previous_high = max(float(item["high"]) for item in previous)
    previous_low = min(float(item["low"]) for item in previous)
    body = abs(close - open_price)
    candle_range = max(high - low, 1e-8)
    upper_wick_ratio = (high - max(open_price, close)) / candle_range
    lower_wick_ratio = (min(open_price, close) - low) / candle_range

    if is_huge_impulse_without_pullback(candles):
        return ConfirmationResult(False, -10, f"{timeframe_label} entry is late after a fast impulse; wait for pullback.", "late", volume_ratio, (f"{timeframe_label} late entry risk",))

    if bias == "long":
        reversal = close < open_price and upper_wick_ratio > 0.42 and volume_ratio >= 1.05
        breakout = close > previous_high and volume_ratio >= 0.95
        pullback_reclaim = low <= ema20 <= close and close > open_price and rsi >= 48
        constructive = close >= ema8 >= ema20 and rsi >= 50 and body <= atr * 1.4
        if reversal:
            return ConfirmationResult(False, -14, f"{timeframe_label} shows rejection against the long entry.", "reversal", volume_ratio, (f"{timeframe_label} bearish rejection",))
        if breakout:
            return ConfirmationResult(True, 5, f"{timeframe_label} is breaking local resistance with acceptable volume.", "breakout", volume_ratio, (f"{timeframe_label} fast breakout",))
        if pullback_reclaim:
            return ConfirmationResult(True, 4, f"{timeframe_label} reclaimed EMA20 after a controlled pullback.", "reclaim", volume_ratio, (f"{timeframe_label} pullback reclaim",))
        if constructive:
            return ConfirmationResult(True, 2, f"{timeframe_label} momentum supports waiting for the 15m trigger.", "constructive", volume_ratio, (f"{timeframe_label} constructive entry timing",))
        return ConfirmationResult(False, -5, f"{timeframe_label} is not clean enough for immediate long entry.", "unclear", volume_ratio, (f"{timeframe_label} entry unclear",))

    reversal = close > open_price and lower_wick_ratio > 0.42 and volume_ratio >= 1.05
    breakdown = close < previous_low and volume_ratio >= 0.95
    pullback_reject = high >= ema20 >= close and close < open_price and rsi <= 52
    constructive = close <= ema8 <= ema20 and rsi <= 50 and body <= atr * 1.4
    if reversal:
        return ConfirmationResult(False, -14, f"{timeframe_label} shows recovery against the short entry.", "reversal", volume_ratio, (f"{timeframe_label} bullish rejection",))
    if breakdown:
        return ConfirmationResult(True, 5, f"{timeframe_label} is breaking local support with acceptable volume.", "breakout", volume_ratio, (f"{timeframe_label} fast breakdown",))
    if pullback_reject:
        return ConfirmationResult(True, 4, f"{timeframe_label} rejected EMA20 after a controlled bounce.", "reclaim", volume_ratio, (f"{timeframe_label} pullback rejection",))
    if constructive:
        return ConfirmationResult(True, 2, f"{timeframe_label} momentum supports waiting for the 15m trigger.", "constructive", volume_ratio, (f"{timeframe_label} constructive entry timing",))
    return ConfirmationResult(False, -5, f"{timeframe_label} is not clean enough for immediate short entry.", "unclear", volume_ratio, (f"{timeframe_label} entry unclear",))


def setup_is_clean(candles: list[dict], signal: TelegramSignal) -> bool:
    atr = average_true_range_local(candles) or max(signal.current_price * 0.015, 1e-8)
    structure = market_structure(candles)
    trend = trend_bias(candles)
    if is_messy_sideways(candles):
        return False
    if is_huge_impulse_without_pullback(candles):
        return False
    if signal.bias == "long" and not (structure["trend"] == "HH/HL" or trend == "bullish"):
        return False
    if signal.bias == "short" and not (structure["trend"] == "LH/LL" or trend == "bearish"):
        return False
    if has_level_conflict(candles, signal.bias, signal.entry, signal.stop_loss, signal.take_profits, atr) and signal.confirmation_state != "breakout":
        return False
    if looks_like_fake_breakout(candles, signal.bias, atr) and signal.confirmation_state != "breakout":
        return False
    if abs(signal.entry - signal.stop_loss) < atr * 0.75:
        return False
    return True


def is_messy_sideways(candles: list[dict]) -> bool:
    if len(candles) < 45:
        return True
    closes = [float(item["close"]) for item in candles]
    atr = average_true_range_local(candles) or max(closes[-1] * 0.01, 1e-8)
    recent = candles[-36:]
    range_high = max(float(item["high"]) for item in recent)
    range_low = min(float(item["low"]) for item in recent)
    ema20_values = ema_local(closes, 20)
    ema50_values = ema_local(closes, 50)
    cross_count = sum(
        1
        for index in range(-20, -1)
        if (closes[index] - ema20_values[index]) * (closes[index + 1] - ema20_values[index + 1]) < 0
    )
    compressed_range = (range_high - range_low) < atr * 3.1
    flat_stack = abs(ema20_values[-1] - ema50_values[-1]) < atr * 0.28
    return compressed_range and flat_stack and cross_count >= 4


def is_huge_impulse_without_pullback(candles: list[dict]) -> bool:
    if len(candles) < 20:
        return False
    atr = average_true_range_local(candles) or 0
    if atr <= 0:
        return False
    last = candles[-1]
    previous = candles[-2]
    last_range = float(last["high"]) - float(last["low"])
    previous_range = float(previous["high"]) - float(previous["low"])
    last_body = abs(float(last["close"]) - float(last["open"]))
    previous_body = abs(float(previous["close"]) - float(previous["open"]))
    return (last_range > atr * 2.6 and last_body > atr * 1.9) or (previous_range > atr * 3.0 and previous_body > atr * 2.1)


def has_level_conflict(
    candles: list[dict],
    bias: str,
    entry: float,
    stop_loss: float,
    take_profits: tuple[float, float, float],
    atr: float,
) -> bool:
    highs, lows = swing_points(candles[-120:])
    risk_distance = max(abs(entry - stop_loss), atr * 0.5)
    minimum_room = max(risk_distance * 1.0, atr * 0.7)
    if bias == "long":
        resistance = [price for _, price in highs if entry < price < take_profits[0]]
        return bool(resistance and min(resistance) - entry < minimum_room)
    if bias == "short":
        support = [price for _, price in lows if take_profits[0] < price < entry]
        return bool(support and entry - max(support) < minimum_room)
    return True


def looks_like_fake_breakout(candles: list[dict], bias: str, atr: float) -> bool:
    if len(candles) < 25:
        return True
    last = candles[-1]
    previous = candles[-22:-1]
    high = float(last["high"])
    low = float(last["low"])
    close = float(last["close"])
    open_price = float(last["open"])
    candle_range = max(high - low, 1e-8)
    body = abs(close - open_price)
    previous_high = max(float(item["high"]) for item in previous)
    previous_low = min(float(item["low"]) for item in previous)

    if bias == "long":
        upper_wick = high - max(open_price, close)
        breakout_failed = high > previous_high and close < previous_high
        weak_close = (high - close) / candle_range > 0.48 and upper_wick > max(body, atr * 0.18)
        return breakout_failed or weak_close
    if bias == "short":
        lower_wick = min(open_price, close) - low
        breakdown_failed = low < previous_low and close > previous_low
        weak_close = (close - low) / candle_range > 0.48 and lower_wick > max(body, atr * 0.18)
        return breakdown_failed or weak_close
    return True


def is_high_volatility(candles: list[dict], symbol: str) -> bool:
    if len(candles) < 20:
        return False
    price = float(candles[-1]["close"])
    atr = average_true_range_local(candles)
    atr_ratio = atr / price if price else 0
    volume_ratio = recent_volume_ratio(candles)
    if symbol.endswith("USDT"):
        return atr_ratio >= 0.018 or volume_ratio >= 1.8
    return atr_ratio >= 0.0075 or volume_ratio >= 1.8


def percent_change(exit_price: float, entry: float, is_long: bool) -> float:
    if not entry:
        return 0.0
    change = (exit_price - entry) / entry * 100
    return change if is_long else -change


def should_send_running_update(payload: dict[str, Any]) -> bool:
    last_update_raw = payload.get("lastRunningUpdateAt")
    if not last_update_raw:
        return True
    try:
        last_update = datetime.fromisoformat(str(last_update_raw))
    except ValueError:
        return True
    return datetime.now(UTC) - last_update >= timedelta(minutes=settings.telegram_signal_running_update_minutes)


def format_signal_followup(symbol: str, event: str, pnl: float, price: float) -> str:
    if event.startswith("TP"):
        event_text = f"{event} ✔"
    elif "Stop" in event:
        event_text = f"{event} ❌"
    elif "running" in event.lower():
        event_text = f"{event} ⏳"
    else:
        event_text = event
    return "\n".join(
        [
            f"{symbol} Signal Update",
            f"{event_text}",
            f"Price: {format_price(price)}",
            f"Result: {pnl:+.2f}%",
            "",
            "Probability-based tracking. Manage risk according to your own plan.",
        ]
    )


def format_signal_followup_v2(symbol: str, event: str, pnl: float, price: float) -> str:
    event_lower = event.lower()
    if event.startswith("TP3") or "full take" in event_lower:
        event_text = "\U0001f3c6 FULL TAKE PROFIT — TRADE COMPLETE"
    elif event.startswith("TP2"):
        event_text = "\u2705 TP2 HIT — PARTIAL PROFIT LOCKED"
    elif event.startswith("TP1"):
        event_text = "\u2705 TP1 HIT — SCALE OR TRAIL"
    elif event.startswith("TP"):
        event_text = f"\u2705 {event.upper()}"
    elif "stop" in event_lower:
        event_text = "\u274c STOP LOSS HIT — TRADE CLOSED"
    elif "invalidated" in event_lower or "trade invalidated" in event_lower:
        event_text = "\u26a0 TRADE INVALIDATED — STRUCTURE BROKEN"
    elif "running" in event_lower:
        event_text = "\u23f3 TRADE IN PROGRESS"
    else:
        event_text = event.upper()
    lines = [
        "VYPEXROCK SIGNAL LIFECYCLE",
        "",
        f"Pair: {friendly_asset_name(symbol)}",
        event_text,
        f"Mark Price: {format_price(price)}",
        f"Unrealized / Realized: {pnl:+.2f}%",
    ]
    if event.startswith("TP1"):
        lines.append("Action: Consider partial take-profit and move stop to breakeven.")
    elif event.startswith("TP2"):
        lines.append("Action: TP2 secured — trail remainder toward TP3 or de-risk.")
    elif event.startswith("TP3"):
        lines.append("Action: Full target reached. Close remainder per your plan.")
    elif "stop" in event_lower:
        lines.append("Reason: Invalidation level breached. Original setup no longer valid.")
    elif "invalidated" in event_lower:
        lines.append("Reason: Setup failed before entry or structure broke. Do not chase.")
    lines.extend(["", "Not financial advice. Probability-based tracking only."])
    return "\n".join(lines)


def format_watchlist_alert(signal: TelegramSignal) -> str:
    direction = "LONG" if signal.bias == "long" else "SHORT"
    level_label = "break and hold above" if signal.bias == "long" else "break and hold below"
    notes = list(signal.quality_notes)
    volume_note = "volume data unreliable" if signal.volume_ratio <= 0.01 else f"{signal.volume_ratio:.2f}x relative volume"
    hot_reason = first_matching_note(notes, ("volume", "breakout", "breakdown", "VWAP", "EMA", "Q_Trend", "Supertrend", "liquidity", "BOS", "CHoCH"))
    hot_reason = hot_reason or "structure is forming near a tactical trigger level"
    return "\n".join(
        [
            "\U0001f440 Watchlist Alert",
            f"Asset: {friendly_asset_name(signal.symbol)}",
            f"Timeframe: {signal.timeframe}",
            f"Direction: {direction}",
            f"Confidence: {signal.confidence}%",
            "Risk Level: High",
            f"Why hot: {hot_reason}.",
            f"Main breakout level: {format_price(signal.entry_trigger)}",
            f"Invalidation level: {format_price(signal.invalidation)}",
            f"Volume confirmation: {volume_note}",
            f"Condition: price must {level_label} {format_price(signal.entry_trigger)} with cleaner momentum.",
            "",
            "Classification: Watchlist only. Wait for confirmation before execution.",
        ]
    )


def first_matching_note(notes: list[str], needles: tuple[str, ...]) -> str | None:
    for note in notes:
        if any(needle.lower() in note.lower() for needle in needles):
            return note
    return notes[0] if notes else None


def friendly_asset_name(symbol: str) -> str:
    return {
        "XAUUSD": "GOLD / XAUUSD",
        "XAGUSD": "SILVER / XAGUSD",
        "USOIL": "WTI OIL / USOIL",
        "UKOIL": "BRENT OIL / UKOIL",
        "BTCUSDT": "BTC / BTCUSDT",
        "ETHUSDT": "ETH / ETHUSDT",
        "SOLUSDT": "SOL / SOLUSDT",
        "XRPUSDT": "XRP / XRPUSDT",
        "DOGEUSDT": "DOGE / DOGEUSDT",
    }.get(symbol, symbol)


def market_mood(average_change: float, green_count: int, total: int) -> str:
    green_ratio = green_count / total if total else 0
    if average_change >= 0.75 and green_ratio >= 0.6:
        return "Constructive, buyers active"
    if average_change <= -0.75 and green_ratio <= 0.4:
        return "Defensive, sellers active"
    return "Neutral, waiting for confirmation"


def format_price(value: float) -> str:
    if value >= 1000:
        return f"${value:,.2f}"
    if value >= 1:
        return f"${value:,.4f}"
    return f"${value:,.8f}".rstrip("0").rstrip(".")


def format_compact(value: float) -> str:
    absolute = abs(value)
    if absolute >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B"
    if absolute >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    if absolute >= 1_000:
        return f"${value / 1_000:.2f}K"
    return f"${value:,.0f}"
