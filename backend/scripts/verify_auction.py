"""Independent correctness verifier -- CLI wrapper.

Usage:
    cd backend
    python -m scripts.verify_auction <auction_public_id>

Reads MySQL directly and re-derives every invariant from raw rows (see
app/services/verifier.py's docstring for why it never calls
bid_service.place_bid). Prints an INTEGRITY REPORT and exits non-zero
on failure, so it can be dropped into a CI step or a post-stress-test
checkpoint (Backend_Build_Guide.md STEP 9 / STEP 10).
"""
import asyncio
import sys

from app.db.engine import get_engine
from app.db.session import AsyncSessionLocal
from app.services.verifier import verify_auction


async def main(auction_public_id: str) -> int:
    async with AsyncSessionLocal() as session:
        report = await verify_auction(session, auction_public_id)

    print("=" * 60)
    print("INTEGRITY REPORT")
    print("=" * 60)
    print(f"Auction:        {report['auction_id']}")
    if "accepted_bids" in report:
        print(f"Accepted bids:  {report['accepted_bids']}")
        print(f"Versions:       {report['versions_checked']}")
    if report["issues"]:
        print(f"Issues found:   {len(report['issues'])}")
        for issue in report["issues"]:
            print(f"  - {issue}")
    else:
        print("Issues found:   0")
    print("-" * 60)
    print(report["result"])
    print("=" * 60)

    await get_engine().dispose()
    return 0 if report["result"] == "INTEGRITY CHECK PASSED" else 1


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.verify_auction <auction_public_id>")
        sys.exit(2)
    sys.exit(asyncio.run(main(sys.argv[1])))
