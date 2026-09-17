"""Background task: poll outbox_events -> publish to Redis.

This is what makes the outbox pattern actually deliver events. The bid
transaction (services/bid_service.py) writes an OutboxEvent row in the
SAME MySQL transaction as the bid -- so if the process crashes right
after commit, the event is still sitting there durably, waiting for
this worker to pick it up and publish it. No committed price update
can silently vanish, even across a crash.

If a worker publishes an event and then crashes before marking it
published, the event will be republished on restart. That's fine --
frontend clients dedupe by auction.version, so a duplicate delivery
is a no-op there.
"""
import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models.outbox import OutboxEvent
from app.db.session import AsyncSessionLocal
from app.observability.metrics import OUTBOX_BACKLOG
from app.realtime.pubsub import channel_for, publish_event
from app.utils.time import utcnow

logger = get_logger(__name__)


async def _publish_batch(batch_size: int = 100) -> int:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(OutboxEvent)
            .where(OutboxEvent.published_at.is_(None))
            .order_by(OutboxEvent.id.asc())
            .limit(batch_size)
        )
        events = list(result.scalars().all())

        for event in events:
            payload = dict(event.payload)
            payload.setdefault("type", event.event_type)
            payload.setdefault("version", event.aggregate_version)
            payload.setdefault("server_committed_at", utcnow().isoformat())

            auction_public_id = payload.get("auction_id")
            if auction_public_id:
                await publish_event(channel_for(auction_public_id), payload)
            event.published_at = utcnow()

        if events:
            await session.commit()

        backlog_result = await session.execute(
            select(OutboxEvent).where(OutboxEvent.published_at.is_(None))
        )
        OUTBOX_BACKLOG.set(len(backlog_result.scalars().all()))

        return len(events)


async def start_outbox_worker() -> None:
    logger.info(
        "Outbox worker started (poll interval=%.2fs)", settings.OUTBOX_POLL_INTERVAL_SECONDS
    )
    while True:
        try:
            await _publish_batch()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Outbox worker iteration failed")
        await asyncio.sleep(settings.OUTBOX_POLL_INTERVAL_SECONDS)


async def stop_outbox_worker(task: asyncio.Task) -> None:
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    logger.info("Outbox worker stopped")
