from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auction import AuctionListResponse, AuctionResponse
from app.schemas.bid import BidHistoryItem
from app.services import auction_service

router = APIRouter()


@router.get("/auctions", response_model=AuctionListResponse)
async def list_auctions(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    items, total = await auction_service.list_all(db, limit=limit, offset=offset)
    responses = [await auction_service.to_response(db, a) for a in items]
    return AuctionListResponse(items=responses, total=total)


@router.get("/auctions/{auction_id}", response_model=AuctionResponse)
async def get_auction(auction_id: str, db: AsyncSession = Depends(get_db)):
    auction = await auction_service.get_by_public_id(db, auction_id)
    return await auction_service.to_response(db, auction)


@router.get("/auctions/{auction_id}/bids", response_model=list[BidHistoryItem])
async def get_bids(auction_id: str, db: AsyncSession = Depends(get_db)):
    auction = await auction_service.get_by_public_id(db, auction_id)
    rows = await auction_service.list_bids(db, auction)
    return [
        BidHistoryItem(
            bid_id=bid.public_id,
            bidder=username,
            amount=bid.amount,
            version=bid.auction_version,
            created_at=bid.created_at,
        )
        for bid, username in rows
    ]
