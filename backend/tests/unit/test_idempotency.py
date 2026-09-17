"""Same idempotency key submitted twice must return the same bid, not
create a duplicate -- and must not double-advance the auction version.
"""
import asyncio
import uuid


async def test_same_idempotency_key_returns_same_bid(client, bidder_headers, live_auction):
    key = str(uuid.uuid4())

    first = await client.post(
        f"/api/v1/auctions/{live_auction.public_id}/bids",
        json={"amount": "110.00"},
        headers={**bidder_headers, "X-Idempotency-Key": key},
    )
    second = await client.post(
        f"/api/v1/auctions/{live_auction.public_id}/bids",
        json={"amount": "110.00"},
        headers={**bidder_headers, "X-Idempotency-Key": key},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["bid_id"] == second.json()["bid_id"]
    # The version must not have double-advanced -- both responses
    # report the SAME version, proving the second call was a replay,
    # not a second accepted bid.
    assert first.json()["version"] == second.json()["version"] == 1


async def test_concurrent_same_key_requests_do_not_double_advance_version(
    client, bidder_headers, live_auction
):
    """Race-safety check: fire the identical idempotency key twice at
    the same time (rather than sequentially). This is what actually
    exercises the IntegrityError-recovery branch in bid_service.py --
    both requests race past the pre-check `find_existing_bid` call,
    then the UNIQUE(auction_id, idempotency_key) constraint stops one
    of them from committing, and that request looks the bid back up
    and returns it instead of erroring.
    """
    key = str(uuid.uuid4())
    headers = {**bidder_headers, "X-Idempotency-Key": key}

    results = await asyncio.gather(
        client.post(
            f"/api/v1/auctions/{live_auction.public_id}/bids",
            json={"amount": "110.00"},
            headers=headers,
        ),
        client.post(
            f"/api/v1/auctions/{live_auction.public_id}/bids",
            json={"amount": "110.00"},
            headers=headers,
        ),
    )

    assert all(r.status_code == 200 for r in results)
    versions = {r.json()["version"] for r in results}
    bid_ids = {r.json()["bid_id"] for r in results}
    assert versions == {1}, f"version double-advanced: {versions}"
    assert len(bid_ids) == 1, f"two different bids were created: {bid_ids}"
