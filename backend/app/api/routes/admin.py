from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auction import AuctionCreate, AuctionResponse
from app.services import auction_service, metrics_service
from app.services.verifier import verify_auction

router = APIRouter()


@router.post("/auctions", response_model=AuctionResponse)
async def create_auction(
    body: AuctionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    auction = await auction_service.create(db, body)
    return await auction_service.to_response(db, auction)


@router.post("/auctions/{auction_id}/start", response_model=AuctionResponse)
async def start_auction(
    auction_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    auction = await auction_service.get_by_public_id(db, auction_id)
    auction = await auction_service.start(db, auction)
    return await auction_service.to_response(db, auction)


@router.post("/auctions/{auction_id}/end", response_model=AuctionResponse)
async def end_auction(
    auction_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    auction = await auction_service.get_by_public_id(db, auction_id)
    auction = await auction_service.end(db, auction)
    return await auction_service.to_response(db, auction)


@router.get("/metrics/live")
async def live_metrics(_: User = Depends(require_admin)):
    return metrics_service.get_live_snapshot()


@router.get("/auctions/{auction_id}/integrity")
async def auction_integrity(
    auction_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await verify_auction(db, auction_id)
