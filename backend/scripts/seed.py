"""Seed demo users + a live demo auction.

Run with:
    cd backend
    python -m scripts.seed

Idempotent: re-running it won't create duplicates -- existing
users/auctions (matched by username / title) are left alone.
"""
import asyncio
from decimal import Decimal
from datetime import timedelta

from sqlalchemy import select

from app.core.logging import get_logger, setup_logging
from app.core.security import hash_password
from app.db.engine import get_engine
from app.db.init_db import create_schema
from app.db.models.auction import Auction
from app.db.models.user import User
from app.db.session import AsyncSessionLocal
from app.utils.time import utcnow

setup_logging()
logger = get_logger(__name__)


async def _get_or_create_user(session, username: str, password: str, role: str) -> User:
    result = await session.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is not None:
        logger.info("User '%s' already exists, skipping.", username)
        return user

    user = User(username=username, password_hash=hash_password(password), role=role)
    session.add(user)
    await session.flush()
    logger.info("Created user '%s' (role=%s).", username, role)
    return user


async def _get_or_create_demo_auction(session) -> Auction:
    title = "Vintage Camera (Demo)"
    result = await session.execute(select(Auction).where(Auction.title == title))
    auction = result.scalar_one_or_none()
    if auction is not None:
        logger.info("Demo auction '%s' already exists, skipping.", title)
        return auction

    now = utcnow()
    auction = Auction(
        title=title,
        description=(
            "A well-loved 35mm rangefinder, seeded for demoing the live "
            "bidding flow. Starts LIVE so you can bid on it immediately."
        ),
        starting_price=Decimal("1000.00"),
        min_increment=Decimal("50.00"),
        current_price=Decimal("1000.00"),
        version=0,
        status="LIVE",
        starts_at=now,
        ends_at=now + timedelta(hours=6),
    )
    session.add(auction)
    await session.flush()
    logger.info("Created demo auction '%s' (id=%s), LIVE for 6 hours.", title, auction.public_id)
    return auction


# BIDFORGE showcase catalog — mirrors the frontend's marketplace lots so
# the UI renders on real engine data. (base, current, increment in INR;
# status + relative offsets from seed time.)
_CATALOG = [
    ("Limited Edition Chronograph", "Tourbillon-grade chronograph from an Atelier run of only 88 pieces. Brushed titanium case, sapphire exhibition caseback and a hand-finished movement.",
     5000, 10000, 500, "LIVE", 0, 360),
    ("Nitro Stealth Runner — Prototype 01", "Pre-production runner from the Nitro lab. Carbon plate, prototype foam, one of three ever made.",
     28000, 28500, 500, "LIVE", 0, 240),
    ("Aurora Field No. 7 — Original Canvas", "Large-format original canvas from the Aurora series. Acrylic and oil on linen, 2024, signed by the artist.",
     115000, 118000, 1000, "LIVE", 0, 480),
    ("2.1ct Fancy Blue Diamond Ring", "GIA-certified fancy blue diamond on a platinum band. Exceptional saturation, VS1 clarity.",
     450000, 465000, 5000, "LIVE", 0, 720),
    ("Couture Leather Handbag — Noir", "Hand-stitched calfskin in noir with brushed hardware. From the winter couture atelier release.",
     230000, 236000, 2000, "LIVE", 0, 300),
    ("Vintage Rangefinder Camera (1958)", "Fully serviced 1958 rangefinder with original leatherette and fresh light seals. Collector grade.",
     35000, 35000, 1000, "UPCOMING", 150, 240),
    ("Signed Stage-Used Electric Guitar", "Stage-used electric guitar signed on the body by the full 2025 tour lineup. Includes flight case and COA.",
     80000, 80000, 2500, "UPCOMING", 310, 480),
    ("Rare Single Malt — 30 Year Release", "Single cask 30-year single malt, bottle 041 of 250. Original presentation case, fill level intact.",
     95000, 95000, 2500, "UPCOMING", 1560, 1920),
    ("Bronze Flow Study — Edition 3/8", "Lost-wax bronze from the Flow series, edition 3 of 8. Patinated by hand, mounted on honed stone.",
     70000, 70000, 2000, "UPCOMING", 4380, 4620),
]


async def _seed_catalog(session) -> None:
    now = utcnow()
    for title, description, base, current, increment, status, start_min, end_min in _CATALOG:
        result = await session.execute(select(Auction).where(Auction.title == title))
        existing = result.scalar_one_or_none()
        if existing is not None:
            # self-healing demo: refresh the window of catalog lots whose
            # scheduled time has already passed so the showcase stays alive
            if existing.ends_at <= now:
                existing.status = status
                existing.starts_at = now + timedelta(minutes=start_min)
                existing.ends_at = now + timedelta(minutes=end_min)
                existing.current_price = Decimal(current)
                logger.info("Refreshed showcase window for '%s' (%s).", title, status)
            else:
                logger.info("Catalog auction '%s' already exists, skipping.", title)
            continue
        session.add(
            Auction(
                title=title,
                description=description,
                starting_price=Decimal(base),
                min_increment=Decimal(increment),
                current_price=Decimal(current),
                version=0,
                status=status,
                starts_at=now + timedelta(minutes=start_min),
                ends_at=now + timedelta(minutes=end_min),
            )
        )
        logger.info("Created catalog auction '%s' (%s).", title, status)
    await session.flush()


async def main() -> None:
    engine = get_engine()
    await create_schema(engine)

    async with AsyncSessionLocal() as session:
        await _get_or_create_user(session, "admin", "admin1234", "ADMIN")
        await _get_or_create_user(session, "alice", "alice1234", "BIDDER")
        await _get_or_create_user(session, "bob", "bob12345", "BIDDER")
        # Organizer Access demo identity — verified server-side at login.
        await _get_or_create_user(session, "ananta@bit", "synora#2026", "ADMIN")
        await _get_or_create_demo_auction(session)
        await _seed_catalog(session)
        await session.commit()

    await engine.dispose()

    print("\nSeed complete. Demo accounts:")
    print("  admin / admin1234   (ADMIN)")
    print("  alice / alice1234   (BIDDER)")
    print("  bob   / bob12345    (BIDDER)")
    print("\nBIDFORGE showcase + demo auction are seeded -- log in and place a bid.")


if __name__ == "__main__":
    asyncio.run(main())
