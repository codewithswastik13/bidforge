from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.bid import Bid


async def find_existing_bid(db: AsyncSession, auction_pk: int, idempotency_key: str) -> Bid | None:
    result = await db.execute(
        select(Bid).where(Bid.auction_id == auction_pk, Bid.idempotency_key == idempotency_key)
    )
    return result.scalar_one_or_none()
