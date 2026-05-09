import asyncio
from collections.abc import AsyncGenerator

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db import base  # noqa: F401

engine = create_async_engine(settings.database_url, pool_pre_ping=True, poolclass=NullPool)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
redis_client: Redis | None = None
redis_loop_id: int | None = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_redis() -> Redis:
    global redis_client, redis_loop_id
    loop_id = id(asyncio.get_running_loop())
    if redis_client is not None and redis_loop_id != loop_id:
        # Redis connections are bound to their original asyncio loop. Celery
        # tasks use a fresh loop per asyncio.run call, so do not close an old
        # connection from the new loop; just replace it safely.
        redis_client = None
        redis_loop_id = None
    if redis_client is None:
        redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
        redis_loop_id = loop_id
    return redis_client


async def close_redis() -> None:
    global redis_client, redis_loop_id
    if redis_client is not None:
        await redis_client.close()
        redis_client = None
        redis_loop_id = None
