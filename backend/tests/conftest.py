"""Shared test fixtures.

Uses a temp-FILE sqlite database (never `:memory:` + StaticPool) so
"concurrent" asyncio sessions get genuinely separate connections --
see the `engine` fixture docstring for why that distinction matters
for the concurrency test specifically.
"""
import os
import tempfile
from datetime import timedelta
from decimal import Decimal

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.models import auction as _auction_model  # noqa: F401  (register model)
from app.db.models import bid as _bid_model  # noqa: F401  (register model)
from app.db.models import outbox as _outbox_model  # noqa: F401  (register model)
from app.db.models import user as _user_model  # noqa: F401  (register model)
from app.db.models.auction import Auction
from app.db.models.user import User
from app.db.session import get_db
from app.main import app
from app.utils.time import utcnow


@pytest_asyncio.fixture
async def engine():
    """A temp-FILE sqlite database, WAL mode, one file per test.

    `:memory:` + StaticPool shares ONE physical connection across every
    "concurrent" asyncio session opened during a test -- two
    "concurrent" bids would then actually serialize through the same
    Python-level connection object, silently defeating the point of
    the concurrency test (test_bid_race.py). A real temp file, with
    WAL mode and a busy-timeout PRAGMA, gives each session its own
    connection and lets SQLite's own (whole-file, not row-level)
    locking do the serializing -- a coarser but honest stand-in for
    InnoDB's row lock, with zero external dependencies.
    """
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db_url = f"sqlite+aiosqlite:///{path}"
    eng = create_async_engine(db_url, connect_args={"timeout": 5})

    @event.listens_for(eng.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield eng

    await eng.dispose()
    for suffix in ("", "-wal", "-shm"):
        try:
            os.unlink(path + suffix)
        except FileNotFoundError:
            pass


@pytest_asyncio.fixture
async def session_factory(engine):
    return async_sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)


@pytest_asyncio.fixture
async def db_session(session_factory) -> AsyncSession:
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(session_factory):
    """An httpx client wired to the real FastAPI app, with get_db
    overridden to hand out sessions against the temp-file test DB
    instead of the real MySQL database.
    """

    async def _override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(db_session) -> User:
    user = User(username="test_admin", password_hash=hash_password("adminpass1"), role="ADMIN")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def bidder_user(db_session) -> User:
    user = User(username="test_bidder", password_hash=hash_password("bidderpass1"), role="BIDDER")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
def admin_headers(admin_user) -> dict:
    token = create_access_token(admin_user.public_id, admin_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
def bidder_headers(bidder_user) -> dict:
    token = create_access_token(bidder_user.public_id, bidder_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def live_auction(db_session) -> Auction:
    auction = Auction(
        title="Test Auction",
        starting_price=Decimal("100.00"),
        min_increment=Decimal("10.00"),
        current_price=Decimal("100.00"),
        version=0,
        status="LIVE",
        starts_at=utcnow() - timedelta(minutes=1),
        ends_at=utcnow() + timedelta(hours=1),
    )
    db_session.add(auction)
    await db_session.commit()
    await db_session.refresh(auction)
    return auction
