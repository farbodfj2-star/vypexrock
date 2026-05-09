from time import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.db.session import get_redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/health"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        key = f"rate-limit:{client_ip}:{int(time() // 60)}"
        redis = await get_redis()
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, 60)
        if count > 180:
            return JSONResponse(status_code=429, content={"detail": "Too many requests"})
        return await call_next(request)
