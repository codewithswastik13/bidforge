"""WebSocket <-> Redis Pub/Sub bridge.

Each connected browser client gets its own Redis subscription to
`auction:{id}:events`. This is simple and correct (no shared fan-out
multiplexer to get wrong) and is fine for a demo/moderate-scale
deployment. At larger scale you'd replace this with a single
per-auction subscriber that fans out to many local WebSocket clients,
to avoid N Redis subscriptions for N browser tabs.

WebSocket messages are transport only, per the framework doc: the
browser never treats them as authoritative if the version looks stale
or has a gap -- see frontend/src/pages/AuctionRoomPage.tsx.
"""
import asyncio

from fastapi import WebSocket

from app.core.logging import get_logger
from app.observability.metrics import METRICS_SNAPSHOT, WS_CONNECTIONS
from app.realtime.pubsub import channel_for
from app.realtime.redis import get_redis

logger = get_logger(__name__)

_active_connections = 0
_lock = asyncio.Lock()


async def _inc() -> None:
    global _active_connections
    async with _lock:
        _active_connections += 1
        WS_CONNECTIONS.set(_active_connections)
        METRICS_SNAPSHOT.set_ws_connections(_active_connections)


async def _dec() -> None:
    global _active_connections
    async with _lock:
        _active_connections = max(0, _active_connections - 1)
        WS_CONNECTIONS.set(_active_connections)
        METRICS_SNAPSHOT.set_ws_connections(_active_connections)


async def handle_connection(websocket: WebSocket, auction_id: str) -> None:
    await websocket.accept()
    await _inc()

    redis = get_redis()
    pubsub = redis.pubsub()
    channel = channel_for(auction_id)
    await pubsub.subscribe(channel)

    async def forward_redis_to_client() -> None:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            await websocket.send_text(message["data"])

    async def watch_for_disconnect() -> None:
        # The client doesn't need to send anything; we just need to
        # notice when the socket closes so we can clean up.
        while True:
            await websocket.receive_text()

    forward_task = asyncio.create_task(forward_redis_to_client())
    watch_task = asyncio.create_task(watch_for_disconnect())

    try:
        done, pending = await asyncio.wait(
            {forward_task, watch_task}, return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()
        for task in done:
            exc = task.exception()
            if exc is not None:
                logger.debug("WS connection for auction %s ended: %r", auction_id, exc)
    finally:
        for task in (forward_task, watch_task):
            task.cancel()
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await _dec()
