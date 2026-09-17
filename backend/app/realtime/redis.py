"""Realtime broker access: redis.asyncio OR a zero-dependency fallback.

Deployment mode (REDIS_URL=redis://...) uses real Redis exactly as
before. Infra-free local mode (REDIS_URL=memory://) swaps in an
asyncio-queue broker that mirrors the small surface this app uses:

    get_redis().publish(channel, payload_str)      # realtime/pubsub.py
    get_redis().pubsub() -> subscribe/listen/...   # websocket_manager.py
    get_redis().ping()                             # observability/health.py

Pub/sub semantics are preserved: every subscriber gets its own queue,
messages go to all current subscribers, and no history is replayed.
"""
import asyncio
from collections.abc import AsyncIterator
from typing import Any

from app.core.config import settings


class _MemoryBroker:
    """Process-wide channel registry shared by all MemoryRedis handles."""

    def __init__(self) -> None:
        self._channels: dict[str, set[asyncio.Queue]] = {}

    def register(self, channel: str, queue: asyncio.Queue) -> None:
        self._channels.setdefault(channel, set()).add(queue)

    def unregister(self, channel: str, queue: asyncio.Queue) -> None:
        self._channels.get(channel, set()).discard(queue)

    async def publish(self, channel: str, message: str) -> int:
        queues = list(self._channels.get(channel, ()))
        for queue in queues:
            try:
                queue.put_nowait(message)
            except asyncio.QueueFull:  # pragma: no cover - bounded but generous
                pass
        return len(queues)


_broker = _MemoryBroker()


class _MemoryPubSub:
    """Subset of redis.asyncio PubSub used by websocket_manager."""

    def __init__(self) -> None:
        self._queue: asyncio.Queue[str] = asyncio.Queue(maxsize=10_000)
        self._channels: set[str] = set()
        self._closed = False

    async def subscribe(self, *channels: str) -> None:
        for channel in channels:
            self._channels.add(channel)
            _broker.register(channel, self._queue)

    async def unsubscribe(self, *channels: str) -> None:
        for channel in channels:
            self._channels.discard(channel)
            _broker.unregister(channel, self._queue)

    async def listen(self) -> AsyncIterator[dict[str, str]]:
        while not self._closed:
            message = await self._queue.get()
            yield {"type": "message", "data": message}

    async def close(self) -> None:
        self._closed = True
        await self.unsubscribe(*self._channels)

    # compatibility with redis.asyncio.PubSub's async-context usage
    async def aclose(self) -> None:
        await self.close()


class MemoryRedis:
    """Subset of redis.asyncio.Redis used by this application."""

    async def ping(self) -> bool:
        return True

    async def publish(self, channel: str, message: str) -> int:
        return await _broker.publish(channel, message)

    def pubsub(self) -> _MemoryPubSub:
        return _MemoryPubSub()

    async def close(self) -> None:  # pragma: no cover - no pooled resources
        return None


def _use_memory_broker() -> bool:
    return settings.REDIS_URL.strip().lower() in ("", "memory", "memory://", "none")


_redis: Any = None


def get_redis() -> Any:
    global _redis
    if _redis is None:
        if _use_memory_broker():
            _redis = MemoryRedis()
        else:
            from redis.asyncio import from_url

            _redis = from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None
