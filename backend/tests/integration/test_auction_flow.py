"""End-to-end HTTP flow: create -> start -> bid -> get -> end, matching
Backend_Build_Guide.md STEP 4's checkpoint ("Create an auction, list
it, start it, end it. All via Swagger.") but automated.
"""
import uuid
from datetime import timedelta

from app.utils.time import utcnow


async def test_full_auction_flow(client, admin_headers, bidder_headers):
    starts_at = (utcnow() - timedelta(minutes=1)).isoformat() + "Z"
    ends_at = (utcnow() + timedelta(hours=1)).isoformat() + "Z"

    create_resp = await client.post(
        "/api/v1/admin/auctions",
        json={
            "title": "Integration Test Auction",
            "description": "Created by test_auction_flow",
            "starting_price": "500.00",
            "min_increment": "25.00",
            "starts_at": starts_at,
            "ends_at": ends_at,
        },
        headers=admin_headers,
    )
    assert create_resp.status_code == 200, create_resp.text
    auction = create_resp.json()
    assert auction["status"] == "UPCOMING"
    auction_id = auction["auction_id"]

    list_resp = await client.get("/api/v1/auctions")
    assert list_resp.status_code == 200
    assert any(a["auction_id"] == auction_id for a in list_resp.json()["items"])

    start_resp = await client.post(
        f"/api/v1/admin/auctions/{auction_id}/start", headers=admin_headers
    )
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "LIVE"

    bid_resp = await client.post(
        f"/api/v1/auctions/{auction_id}/bids",
        json={"amount": "525.00"},
        headers={**bidder_headers, "X-Idempotency-Key": str(uuid.uuid4())},
    )
    assert bid_resp.status_code == 200, bid_resp.text
    assert bid_resp.json()["accepted"] is True

    get_resp = await client.get(f"/api/v1/auctions/{auction_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["current_price"] == "525.00"
    assert get_resp.json()["current_winner"] == "test_bidder"

    end_resp = await client.post(
        f"/api/v1/admin/auctions/{auction_id}/end", headers=admin_headers
    )
    assert end_resp.status_code == 200
    assert end_resp.json()["status"] == "ENDED"

    # A bid after close must be rejected.
    post_close_bid = await client.post(
        f"/api/v1/auctions/{auction_id}/bids",
        json={"amount": "550.00"},
        headers={**bidder_headers, "X-Idempotency-Key": str(uuid.uuid4())},
    )
    assert post_close_bid.status_code == 409

    # The independent verifier should confirm no issues.
    integrity_resp = await client.get(
        f"/api/v1/admin/auctions/{auction_id}/integrity", headers=admin_headers
    )
    assert integrity_resp.status_code == 200
    assert integrity_resp.json()["result"] == "INTEGRITY CHECK PASSED"
