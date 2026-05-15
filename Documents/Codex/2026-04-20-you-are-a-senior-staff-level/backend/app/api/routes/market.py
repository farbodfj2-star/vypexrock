from datetime import datetime

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db, get_redis
from app.schemas.market import Candle, CoinDetail, MarketOpportunityRead, MarketTicker, SignalRead
from app.services.market_scan_service import MarketScanService
from app.services.market_service import MarketService
from app.services.signal_service import SignalEngine

router = APIRouter()


@router.get("/dashboard", response_model=list[MarketTicker])
async def dashboard() -> list[MarketTicker]:
    rows = await MarketService().fetch_dashboard()
    return [MarketTicker(**item) for item in rows]


@router.get("/opportunities", response_model=list[MarketOpportunityRead])
async def opportunities(
    limit: int = Query(default=12, ge=1, le=24),
    timeframe: str = Query(default="15m"),
) -> list[MarketOpportunityRead]:
    rows = await MarketScanService().scan_opportunities(limit=limit, timeframe=timeframe.lower())
    return [MarketOpportunityRead(**item) for item in rows]


@router.get("/coins/{symbol}", response_model=CoinDetail)
async def coin_detail(
    symbol: str,
    interval: str = Query(default="1h"),
    db: AsyncSession = Depends(get_db),
) -> CoinDetail:
    service = MarketService(db)
    candles = await service.fetch_candles(symbol.upper(), interval)
    signal_engine = SignalEngine()
    live_signal = await signal_engine.compute(candles) if candles else None
    tickers = await service.fetch_dashboard()
    ticker = next((item for item in tickers if item["symbol"] == symbol.upper()), None) or {
        "symbol": symbol.upper(),
        "price": float(candles[-1]["close"]) if candles else 0,
        "change_24h": 0,
        "volume_24h": 0,
    }
    signal_rows = (
        [
            SignalRead(
                id=0,
                symbol=symbol.upper(),
                timeframe=interval,
                bias=live_signal.bias,
                confidence=live_signal.confidence,
                entry_low=live_signal.entry_low,
                entry_high=live_signal.entry_high,
                stop_loss=live_signal.stop_loss,
                take_profit_1=live_signal.take_profit_1,
                take_profit_2=live_signal.take_profit_2,
                take_profit_3=live_signal.take_profit_3,
                rsi=live_signal.rsi,
                ema20=live_signal.ema20,
                ema50=live_signal.ema50,
                macd=live_signal.macd,
                macd_signal=live_signal.macd_signal,
                structure_state=live_signal.structure_state,
                explanation=live_signal.explanation,
                suggested_risk_note=live_signal.suggested_risk_note,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
        ]
        if live_signal
        else []
    )
    return CoinDetail(
        symbol=symbol.upper(),
        ticker=MarketTicker(**ticker),
        candles=[
            Candle(
                open_time=datetime.fromisoformat(item["open_time"]),
                open=float(item["open"]),
                high=float(item["high"]),
                low=float(item["low"]),
                close=float(item["close"]),
                volume=float(item["volume"]),
            )
            for item in candles
        ],
        signals=signal_rows,
    )


@router.websocket("/ws/market")
async def market_socket(websocket: WebSocket):
    await websocket.accept()
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe("market-stream")
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=5.0)
            if message and message.get("data"):
                await websocket.send_text(message["data"])
    except WebSocketDisconnect:
        await pubsub.unsubscribe("market-stream")
        await pubsub.close()
