from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.auction import Auction
from app.db.models.bid import Bid
from app.db.models.outbox import OutboxEvent
from app.db.models.user import User
from app.schemas.auction import AuctionCreate
from app.utils.time import to_naive_utc


async def _next_outbox_version(db: AsyncSession, auction_id: int) -> int:
    """Lifecycle events (AUCTION_STARTED/AUCTION_ENDED) must not reuse
    auction.version for aggregate_version: ENDED at v1 would collide
    with the BID_ACCEPTED emitted at v1 under
    UNIQUE(aggregate_type, aggregate_id, aggregate_version). Allocate
    max+1 instead -- safe because lifecycle transitions are serialized
    by the auction row lock and always trail the bid versions."""
    result = await db.execute(
        select(func.max(OutboxEvent.aggregate_version)).where(
            OutboxEvent.aggregate_type == "AUCTION",
            OutboxEvent.aggregate_id == auction_id,
        )
    )
    return (result.scalar() or -1) + 1


async def create(db: AsyncSession, data: AuctionCreate) -> Auction:
    auction = Auction(
        title=data.title,
        description=data.description,
        starting_price=data.starting_price,
        min_increment=data.min_increment,
        current_price=data.starting_price,
        version=0,
        status="UPCOMING",
        starts_at=to_naive_utc(data.starts_at),
        ends_at=to_naive_utc(data.ends_at),
    )
    db.add(auction)
    await db.commit()
    await db.refresh(auction)
    return auction


async def list_all(db: AsyncSession, limit: int = 50, offset: int = 0) -> tuple[list[Auction], int]:
    result = await db.execute(
        select(Auction).order_by(Auction.created_at.desc()).limit(limit).offset(offset)
    )
    items = list(result.scalars().all())
    total_result = await db.execute(select(Auction.id))
    total = len(total_result.scalars().all())
    return items, total


async def get_by_public_id(db: AsyncSession, auction_id: str) -> Auction:
    result = await db.execute(select(Auction).where(Auction.public_id == auction_id))
    auction = result.scalar_one_or_none()
    if auction is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Auction not found")
    return auction


async def list_bids(db: AsyncSession, auction: Auction, limit: int = 50) -> list[tuple[Bid, str]]:
    result = await db.execute(
        select(Bid, User.username)
        .join(User, User.id == Bid.bidder_id)
        .where(Bid.auction_id == auction.id)
        .order_by(Bid.auction_version.desc())
        .limit(limit)
    )
    return [(bid, username) for bid, username in result.all()]


async def start(db: AsyncSession, auction: Auction) -> Auction:
    fresh = await db.execute(select(Auction).where(Auction.id == auction.id).with_for_update())
    auction = fresh.scalar_one()
    if auction.status != "UPCOMING":
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Cannot start auction in status {auction.status}"
        )
    auction.status = "LIVE"
    db.add(
        OutboxEvent(
            aggregate_type="AUCTION",
            aggregate_id=auction.id,
            event_type="AUCTION_STARTED",
            aggregate_version=await _next_outbox_version(db, auction.id),
            payload={"auction_id": auction.public_id, "status": "LIVE"},
        )
    )
    await db.commit()
    await db.refresh(auction)
    return auction


async def end(db: AsyncSession, auction: Auction) -> Auction:
    fresh = await db.execute(select(Auction).where(Auction.id == auction.id).with_for_update())
    auction = fresh.scalar_one()
    if auction.status != "LIVE":
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Cannot end auction in status {auction.status}"
        )
    auction.status = "ENDED"
    db.add(
        OutboxEvent(
            aggregate_type="AUCTION",
            aggregate_id=auction.id,
            event_type="AUCTION_ENDED",
            aggregate_version=await _next_outbox_version(db, auction.id),
            payload={
                "auction_id": auction.public_id,
                "status": "ENDED",
                "winner_user_id": auction.current_winner_id,
                "final_price": str(auction.current_price),
            },
        )
    )
    await db.commit()
    await db.refresh(auction)
    return auction


def _to_response_dict(auction: Auction, winner_username: str | None) -> dict:
    return {
        "auction_id": auction.public_id,
        "title": auction.title,
        "description": auction.description,
        "starting_price": auction.starting_price,
        "min_increment": auction.min_increment,
        "current_price": auction.current_price,
        "version": auction.version,
        "status": auction.status,
        "current_winner": winner_username,
        "starts_at": auction.starts_at,
        "ends_at": auction.ends_at,
    }


async def to_response(db: AsyncSession, auction: Auction) -> dict:
    winner_username = None
    if auction.current_winner_id:
        res = await db.execute(select(User.username).where(User.id == auction.current_winner_id))
        winner_username = res.scalar_one_or_none()
    return _to_response_dict(auction, winner_username)
