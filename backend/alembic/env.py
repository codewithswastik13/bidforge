"""Async Alembic environment.

Run from the backend/ directory (alembic.ini's `prepend_sys_path = .`
puts backend/ on sys.path so `import app` resolves): 

    cd backend
    alembic upgrade head

This migration exists for anyone who wants proper versioned schema
history. It is NOT required for local dev -- AUTO_CREATE_SCHEMA=true
(the default) makes the backend create its own schema idempotently on
startup via app/db/init_db.py. Both paths use the identical DDL from
RTB_Auction_System_Framework.md section 6; keep them in sync if the
schema ever changes.
"""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.db.base import Base
from app.db.models import auction, bid, outbox, user  # noqa: F401  (register all models)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Generate SQL scripts without a live DB connection (`alembic upgrade head --sql`)."""
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def _do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(get_url(), poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(_do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
