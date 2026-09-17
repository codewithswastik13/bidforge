"""The most important test in the suite (Backend_Build_Guide.md STEP 8):
fire many concurrent bids at exactly the same, just-barely-acceptable
amount and prove at most one is accepted.

IMPORTANT CAVEAT -- read before trusting this test as final proof of
correctness under MySQL/InnoDB:

This suite runs against SQLite (see conftest.py's `engine` fixture),
not MySQL, because the build environment that produced this project
had no network access to install/run MySQL. SQLite has no row-level
locking -- `SELECT ... FOR UPDATE` compiles to a silent no-op on the
SQLite dialect (SQLAlchemy simply drops the clause), and what actually
serializes these "concurrent" writers is SQLite's own whole-FILE write
lock (mitigated with WAL mode + a busy-timeout PRAGMA in the fixture).
That is a coarser mechanism than InnoDB's row lock, but it is still a
real, external, multi-connection lock -- not a Python-level illusion --
so a bid_service.py bug that dropped the locking entirely (e.g. forgot
`.with_for_update()`, or ran the check-then-write outside a
transaction) would still very likely be caught here, since SQLite
would then let both writers interleave and the assertion below would
fail.

What this test does NOT exercise: InnoDB-specific deadlock error code
1213 / lock-wait-timeout code 1205 (bid_service.py's retry logic for
those paths is exercised at the code-review level, not by this test --
SQLite raises a different, string-keyed OperationalError for "database
is locked", which `_is_retryable()` intentionally does NOT match, so
those requests surface as 503 DATABASE_CONTENTION here instead of
retrying). Treat a pass here as good evidence, not final proof --
the authoritative check is `scripts/verify_auction.py` run against a
real MySQL auction after a real k6 stress run (see k6/stress_test.js
and the root README).
"""
import asyncio
import uuid


async def test_concurrent_bids_only_one_wins_same_price(client, bidder_headers, live_auction):
    """20 requests, all bidding the exact minimum-acceptable amount.
    At most one can be accepted -- once any one of them commits, the
    minimum for all the others rises above their bid.
    """
    minimum = live_auction.current_price + live_auction.min_increment  # "110.00"

    async def _bid():
        return await client.post(
            f"/api/v1/auctions/{live_auction.public_id}/bids",
            json={"amount": str(minimum)},
            headers={**bidder_headers, "X-Idempotency-Key": str(uuid.uuid4())},
        )

    results = await asyncio.gather(*[_bid() for _ in range(20)])

    accepted = [r for r in results if r.status_code == 200 and r.json().get("accepted")]
    rejected_too_low = [
        r
        for r in results
        if r.status_code == 409 and r.json().get("detail", {}).get("code") == "BID_TOO_LOW"
    ]
    contention = [r for r in results if r.status_code == 503]

    assert len(accepted) <= 1, f"more than one bid accepted at the same price: {len(accepted)}"
    # Every request must land in exactly one understood bucket -- no
    # silent 500s, no unaccounted-for responses.
    assert len(accepted) + len(rejected_too_low) + len(contention) == len(results)
    if accepted:
        assert accepted[0].json()["version"] == 1
