"""Unit tests for the core bid-acceptance rules in bid_service.place_bid,
exercised through the HTTP layer (routes/bids.py) so the test also
covers the request/response contract, not just the service function.
"""
import uuid



async def test_valid_bid_is_accepted(client, bidder_headers, live_auction):
    resp = await client.post(
        f"/api/v1/auctions/{live_auction.public_id}/bids",
        json={"amount": "110.00"},
        headers={**bidder_headers, "X-Idempotency-Key": str(uuid.uuid4())},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["accepted"] is True
    assert body["amount"] == "110.00"
    assert body["version"] == 1


async def test_bid_below_minimum_is_rejected(client, bidder_headers, live_auction):
    # min_increment is 10.00 on top of current_price 100.00, so 105.00
    # is below the 110.00 minimum.
    resp = await client.post(
        f"/api/v1/auctions/{live_auction.public_id}/bids",
        json={"amount": "105.00"},
        headers={**bidder_headers, "X-Idempotency-Key": str(uuid.uuid4())},
    )
    assert resp.status_code == 409
    body = resp.json()["detail"]
    assert body["accepted"] is False
    assert body["code"] == "BID_TOO_LOW"
    assert body["minimum_bid"] == "110.00"


async def test_version_increments_across_sequential_bids(client, bidder_headers, live_auction):
    first = await client.post(
        f"/api/v1/auctions/{live_auction.public_id}/bids",
        json={"amount": "110.00"},
        headers={**bidder_headers, "X-Idempotency-Key": str(uuid.uuid4())},
    )
    second = await client.post(
        f"/api/v1/auctions/{live_auction.public_id}/bids",
        json={"amount": "130.00"},
        headers={**bidder_headers, "X-Idempotency-Key": str(uuid.uuid4())},
    )
    assert first.json()["version"] == 1
    assert second.json()["version"] == 2
    assert second.json()["current_price"] == "130.00"
