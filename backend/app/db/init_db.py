"""Idempotent schema bootstrap.

Two schema-creation paths exist in this project, deliberately:

  1. THIS file -- raw `CREATE TABLE IF NOT EXISTS` DDL, run automatically
     on FastAPI startup when AUTO_CREATE_SCHEMA=true (the default). It
     mirrors RTB_Auction_System_Framework.md section 6 EXACTLY, so
     `docker compose up -d` + `uvicorn app.main:app` alone is enough to
     get a fully-indexed, correct schema with zero manual steps.
  2. backend/alembic/versions/0001_initial_schema.py -- the same DDL,
     wrapped as a real migration, for anyone who wants proper versioned
     schema history going forward. Alembic is not required for local
     dev to work.

Both must be kept in sync if the schema ever changes; there is
intentionally no ORM-driven `Base.metadata.create_all()` against MySQL,
because that path does not reliably reproduce hand-written indexes,
DATETIME(6) precision, or storage engine choice the way explicit DDL
does. `Base.metadata.create_all()` IS used, on purpose, for the sqlite
test database (see tests/conftest.py) where none of that matters.
"""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.logging import get_logger

logger = get_logger(__name__)

_MYSQL_DDL = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(36) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'BIDDER',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS auctions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(36) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        starting_price DECIMAL(18,2) NOT NULL,
        min_increment DECIMAL(18,2) NOT NULL DEFAULT 1.00,
        current_price DECIMAL(18,2) NOT NULL,
        current_bid_id BIGINT UNSIGNED NULL,
        current_winner_id BIGINT UNSIGNED NULL,
        version BIGINT UNSIGNED NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
        starts_at DATETIME(6) NOT NULL,
        ends_at DATETIME(6) NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX idx_auction_status_time (status, starts_at, ends_at),
        INDEX idx_auction_updated (updated_at)
    ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS bids (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id CHAR(36) NOT NULL UNIQUE,
        auction_id BIGINT UNSIGNED NOT NULL,
        bidder_id BIGINT UNSIGNED NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        auction_version BIGINT UNSIGNED NOT NULL,
        idempotency_key CHAR(36) NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

        CONSTRAINT fk_bid_auction FOREIGN KEY (auction_id) REFERENCES auctions(id),
        CONSTRAINT fk_bidder FOREIGN KEY (bidder_id) REFERENCES users(id),
        UNIQUE KEY uq_bid_version (auction_id, auction_version),
        UNIQUE KEY uq_bid_idempotency (auction_id, idempotency_key),
        INDEX idx_bid_auction_time (auction_id, created_at),
        INDEX idx_bid_auction_version (auction_id, auction_version)
    ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS outbox_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        aggregate_type VARCHAR(50) NOT NULL,
        aggregate_id BIGINT UNSIGNED NOT NULL,
        event_type VARCHAR(80) NOT NULL,
        aggregate_version BIGINT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        published_at DATETIME(6) NULL,

        UNIQUE KEY uq_outbox_version (aggregate_type, aggregate_id, aggregate_version),
        INDEX idx_outbox_unpublished (published_at, created_at)
    ) ENGINE=InnoDB;
    """,
]


async def create_schema(engine: AsyncEngine) -> None:
    """Create all tables if they don't already exist.

    Safe to call every time the app starts -- `IF NOT EXISTS` makes it
    a no-op once the schema is in place. For MySQL this runs the exact
    hand-written DDL above (see module docstring for why). For any
    other dialect (sqlite, used only in tests) it falls back to the
    ORM's own `Base.metadata.create_all`, which is perfectly fine there
    since tests don't depend on MySQL-specific index/engine syntax.
    """
    if engine.dialect.name == "mysql":
        async with engine.begin() as conn:
            for statement in _MYSQL_DDL:
                await conn.execute(text(statement))
        logger.info("MySQL schema ensured (CREATE TABLE IF NOT EXISTS x4).")
    else:
        from app.db.base import Base
        from app.db.models import auction, bid, outbox, user  # noqa: F401  (register models)

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Schema ensured via metadata.create_all (dialect=%s).", engine.dialect.name)
