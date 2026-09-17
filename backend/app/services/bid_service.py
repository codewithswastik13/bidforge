"""The critical, correctness-first bid transaction.

Rules (RTB_Auction_System_Framework.md section 7 / Backend_Build_Guide.md STEP 5):
  1. SELECT ... FOR UPDATE locks the auction row FIRST, before anything
     else touches it.
  2. Idempotency is checked before creating a new bid, AND enforced by
     a UNIQUE(auction_id, idempotency_key) constraint, so a race between
     two identical retries can never create two rows -- the pre-check
     handles the common case, the constraint handles the race.
  3. NO Redis calls, NO WebSocket sends, NO slow business logic happen
     while the row lock is held. That is strictly the outbox worker's
     job, after commit (see realtime/outbox_worker.py).
  4. Only deadlocks / lock-wait timeouts are retried, and only up to
     MAX_RETRIES times, with a short randomized backoff. Business
     rejections (BID_TOO_LOW, AUCTION_ENDED, ...) are never retried.
"""
import asyncio
import random
import time
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuctionEnded, AuctionNotLive, BidTooLow, DatabaseContention
from app.core.logging import get_logger
from app.db.models.auction import Auction
from app.db.models.bid import Bid
from app.db.models.outbox import OutboxEvent
from app.db.models.user import User
from app.observability.metrics import (
    BID_ATTEMPTS,
    BID_LATENCY,
    DB_DEADLOCKS,
    DB_LOCK_WAITS,
    METRICS_SNAPSHOT,
)
from app.services.idempotency import find_existing_bid
from app.utils.time import utcnow

logger = get_logger(__name__)

MAX_RETRIES = 3
# MySQL error codes worth retrying: 1213 = deadlock, 1205 = lock wait timeout.
RETRYABLE_MYSQL_ERRORS = {1213, 1205}


def _record(result: str) -> None:
    BID_ATTEMPTS.labels(result=result).inc()
    METRICS_SNAPSHOT.record_bid(result)


def _is_retryable(exc: OperationalError) -> bool:
    orig = getattr(exc, "orig", None)
    args = getattr(orig, "args", None) or ()
    code = args[0] if args else None
    return code in RETRYABLE_MYSQL_ERRORS


async def _backoff(attempt: int) -> None:
    delay = min(0.05 * (2**attempt), 0.5) + random.uniform(0, 0.02)
    await asyncio.sleep(delay)


def _money(value: Decimal) -> str:
    """Money contract: every amount crossing the API is a 2-decimal
    string, matching the outbox payloads and BidTooLow detail."""
    return f"{value:.2f}"


def _existing_bid_response(auction_public_id: str, bid: Bid, current_price: Decimal) -> dict:
    return {
        "accepted": True,
        "bid_id": bid.public_id,
        "auction_id": auction_public_id,
        "amount": _money(bid.amount),
        "version": bid.auction_version,
        "current_price": _money(current_price),
        "replay": True,
    }


async def place_bid(
    db: AsyncSession,
    auction_public_id: str,
    bidder: User,
    amount: Decimal,
    idempotency_key: UUID,
) -> dict:
    start_time = time.perf_counter()
    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            # FastAPI caches dependencies, so this session is shared with
            # get_current_user, whose SELECT leaves an autobegin
            # transaction open. Close that read-only transaction so the
            # bid's own transaction (and its row lock) starts clean.
            if db.in_transaction():
                await db.commit()

            async with db.begin():
                # 1. Lock the single auction row first.
                result = await db.execute(
                    select(Auction).where(Auction.public_id == auction_public_id).with_for_update()
                )
                auction = result.scalar_one_or_none()
                if auction is None:
                    _record("not_found")
                    raise AuctionNotLive()

                # 2. Check lifecycle.
                if auction.status != "LIVE":
                    _record("not_live")
                    raise AuctionNotLive()
                if utcnow() >= auction.ends_at:
                    _record("ended")
                    raise AuctionEnded()

                # 3. Check idempotency BEFORE creating a new bid.
                existing_bid = await find_existing_bid(db, auction.id, str(idempotency_key))
                if existing_bid is not None:
                    _record("idempotent_replay")
                    return _existing_bid_response(auction.public_id, existing_bid, auction.current_price)

                # 4. Check the current serialized price.
                minimum = auction.current_price + auction.min_increment
                if amount < minimum:
                    _record("too_low")
                    raise BidTooLow(
                        current_price=auction.current_price,
                        minimum_bid=minimum,
                        attempted_amount=amount,
                        version=auction.version,
                    )

                # 5. Advance the serialized version.
                next_version = auction.version + 1

                # 6. Insert accepted bid.
                bid = Bid(
                    auction_id=auction.id,
                    bidder_id=bidder.id,
                    amount=amount,
                    auction_version=next_version,
                    idempotency_key=str(idempotency_key),
                )
                db.add(bid)
                await db.flush()  # assigns bid.id / bid.public_id

                # 7. Update authoritative auction state.
                auction.current_price = amount
                auction.current_bid_id = bid.id
                auction.current_winner_id = bidder.id
                auction.version = next_version

                # 8. Write the outbox event in the SAME transaction.
                db.add(
                    OutboxEvent(
                        aggregate_type="AUCTION",
                        aggregate_id=auction.id,
                        event_type="BID_ACCEPTED",
                        aggregate_version=next_version,
                        payload={
                            "auction_id": auction.public_id,
                            "bid_id": bid.public_id,
                            "price": str(amount),
                            "version": next_version,
                            "bidder_public_id": bidder.public_id,
                        },
                    )
                )

                bid_public_id, bid_amount, bid_version = bid.public_id, bid.amount, bid.auction_version
                # 9. Leaving `async with db.begin()` commits the transaction.

            _record("accepted")
            BID_LATENCY.observe(time.perf_counter() - start_time)
            return {
                "accepted": True,
                "bid_id": bid_public_id,
                "auction_id": auction_public_id,
                "amount": _money(bid_amount),
                "version": bid_version,
                "current_price": _money(bid_amount),
                "replay": False,
            }

        except (AuctionNotLive, AuctionEnded, BidTooLow):
            # Business rejections are never retried. The `async with
            # db.begin()` block already rolled back automatically.
            BID_LATENCY.observe(time.perf_counter() - start_time)
            raise

        except IntegrityError as exc:
            # Two concurrent requests raced past the idempotency
            # pre-check; UNIQUE(auction_id, idempotency_key) caught it
            # at commit time. Look up the bid that won the race and
            # return IT, so the caller still gets a clean idempotent
            # response instead of an error.
            auction_lookup = await db.execute(
                select(Auction.id).where(Auction.public_id == auction_public_id)
            )
            auction_pk = auction_lookup.scalar_one_or_none()
            existing_bid = (
                await find_existing_bid(db, auction_pk, str(idempotency_key)) if auction_pk else None
            )
            if existing_bid is not None:
                _record("idempotent_replay_race")
                BID_LATENCY.observe(time.perf_counter() - start_time)
                return _existing_bid_response(auction_public_id, existing_bid, existing_bid.amount)

            last_error = exc
            DB_DEADLOCKS.inc()
            METRICS_SNAPSHOT.record_deadlock()
            logger.warning("IntegrityError without a matching idempotent bid; retrying: %s", exc)
            await _backoff(attempt)

        except OperationalError as exc:
            last_error = exc
            if _is_retryable(exc):
                DB_LOCK_WAITS.inc()
                METRICS_SNAPSHOT.record_lock_wait()
                logger.warning("Retryable DB contention on attempt %s: %s", attempt + 1, exc)
                await _backoff(attempt)
                continue
            _record("contention")
            BID_LATENCY.observe(time.perf_counter() - start_time)
            raise DatabaseContention() from exc

    _record("contention_exhausted")
    BID_LATENCY.observe(time.perf_counter() - start_time)
    raise DatabaseContention() from last_error
