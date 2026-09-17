"""Independent correctness verifier.

Deliberately reads MySQL directly and re-derives every invariant from
raw rows. It never calls bid_service.place_bid, so a bug in the
bid-writing path can't hide itself from this checker (see
RTB_Auction_System_Framework.md section 20). Reused by both the CLI
(scripts/verify_auction.py) and the admin API
(GET /api/v1/admin/auctions/{id}/integrity) -- reusing the *read* logic
between the two doesn't compromise independence; only reusing the
*write* logic would.
"""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.auction import Auction
from app.db.models.bid import Bid


async def verify_auction(db: AsyncSession, auction_public_id: str) -> dict:
    auction_result = await db.execute(select(Auction).where(Auction.public_id == auction_public_id))
    auction = auction_result.scalar_one_or_none()
    if auction is None:
        return {"auction_id": auction_public_id, "issues": ["auction not found"], "result": "INTEGRITY CHECK FAILED"}

    bids_result = await db.execute(
        select(Bid).where(Bid.auction_id == auction.id).order_by(Bid.auction_version.asc())
    )
    bids = list(bids_result.scalars().all())

    issues: list[str] = []
    expected_version = 1
    prev_amount: Decimal | None = None

    for bid in bids:
        # 1 & 2. Versions are contiguous 1..N, one bid per version.
        if bid.auction_version != expected_version:
            issues.append(
                f"version gap: expected {expected_version}, got {bid.auction_version} "
                f"(bid {bid.public_id})"
            )
        expected_version += 1

        # 4. Amounts strictly increase.
        if prev_amount is not None and bid.amount <= prev_amount:
            issues.append(
                f"non-increasing amount at version {bid.auction_version}: "
                f"{bid.amount} <= {prev_amount}"
            )
        prev_amount = bid.amount

    # 7. Idempotency keys unique across this auction's accepted bids.
    keys = [b.idempotency_key for b in bids]
    if len(keys) != len(set(keys)):
        issues.append("duplicate idempotency_key found across accepted bids")

    if bids:
        latest = bids[-1]
        # 5 & 6. current_price / version match latest bid.
        if auction.current_price != latest.amount:
            issues.append(
                f"current_price mismatch: auction={auction.current_price} latest_bid={latest.amount}"
            )
        if auction.version != latest.auction_version:
            issues.append(
                f"version mismatch: auction={auction.version} latest_bid={latest.auction_version}"
            )
        # 9. Winner matches latest bidder.
        if auction.current_winner_id != latest.bidder_id:
            issues.append("winner mismatch: current_winner_id != latest bid's bidder_id")
        # 8. No bids after the auction closed.
        if auction.status == "ENDED":
            after_close = [b for b in bids if b.created_at > auction.ends_at]
            if after_close:
                issues.append(f"{len(after_close)} bid(s) accepted after auction close")
    elif auction.version != 0:
        issues.append("auction has no bids but version != 0")

    return {
        "auction_id": auction.public_id,
        "accepted_bids": len(bids),
        "versions_checked": f"1..{len(bids)}" if bids else "none",
        "issues": issues,
        "result": "INTEGRITY CHECK PASSED" if not issues else "INTEGRITY CHECK FAILED",
    }
