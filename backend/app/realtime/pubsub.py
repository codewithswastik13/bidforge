import json
from typing import Any

from app.realtime.redis import get_redis


def channel_for(auction_public_id: str) -> str:
    return f"auction:{auction_public_id}:events"


async def publish_event(channel: str, payload: dict[str, Any]) -> None:
    redis = get_redis()
    await redis.publish(channel, json.dumps(payload))
