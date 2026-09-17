"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-09-17

Raw SQL matching RTB_Auction_System_Framework.md section 6 exactly
(same DDL as app/db/init_db.py, wrapped as a migration -- see that
module's docstring for why both exist). Wrapped in IF NOT EXISTS /
IF EXISTS so this migration is itself idempotent and safe to run even
if AUTO_CREATE_SCHEMA already created the tables.
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            public_id CHAR(36) NOT NULL UNIQUE,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'BIDDER',
            created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ) ENGINE=InnoDB;
        """
    )
    op.execute(
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
        """
    )
    op.execute(
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
        """
    )
    op.execute(
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
        """
    )


def downgrade() -> None:
    # Reverse dependency order: outbox_events and bids reference/depend
    # on the others existing first, so they're dropped first.
    op.execute("DROP TABLE IF EXISTS outbox_events;")
    op.execute("DROP TABLE IF EXISTS bids;")
    op.execute("DROP TABLE IF EXISTS auctions;")
    op.execute("DROP TABLE IF EXISTS users;")
