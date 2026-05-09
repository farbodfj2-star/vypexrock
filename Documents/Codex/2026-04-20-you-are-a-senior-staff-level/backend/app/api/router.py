from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.routes import ai, alerts, auth, chart, community, market, telegram, watchlist
from app.db.session import get_redis

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(chart.router, prefix="/chart", tags=["chart"])
api_router.include_router(community.router, prefix="/community", tags=["community"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(watchlist.router, prefix="/watchlist", tags=["watchlist"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])


@api_router.websocket("/ws/market")
async def legacy_market_socket(websocket: WebSocket):
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
