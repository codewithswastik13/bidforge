from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import AuctionEnded, AuctionNotLive, BidTooLow, DatabaseContention
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.bid import BidRejected, BidRequest
from app.services import bid_service

router = APIRouter()


@router.post("/auctions/{auction_id}/bids")
async def place_bid(
    auction_id: str,
    body: BidRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    x_idempotency_key: str | None = Header(default=None, alias="X-Idempotency-Key"),
):
    try:
        idempotency_key = UUID(x_idempotency_key) if x_idempotency_key else uuid4()
    except ValueError:
        raise HTTPException(status_code=400, detail="X-Idempotency-Key must be a valid UUID")

    try:
        return await bid_service.place_bid(db, auction_id, user, body.amount, idempotency_key)
    except BidTooLow as exc:
        raise HTTPException(
            status_code=409,
            detail=BidRejected(
                code="BID_TOO_LOW",
                attempted_amount=exc.attempted_amount,
                current_price=exc.current_price,
                minimum_bid=exc.minimum_bid,
                version=exc.version,
            ).model_dump(mode="json"),
        )
    except AuctionNotLive:
        raise HTTPException(status_code=409, detail={"accepted": False, "code": "AUCTION_NOT_LIVE"})
    except AuctionEnded:
        raise HTTPException(status_code=409, detail={"accepted": False, "code": "AUCTION_ENDED"})
    except DatabaseContention:
        raise HTTPException(status_code=503, detail={"accepted": False, "code": "DATABASE_CONTENTION"})
