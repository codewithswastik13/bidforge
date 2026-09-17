import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CHAR, DECIMAL, BigInteger, DateTime, Index, String, Text
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.utils.time import utcnow


class Auction(Base):
    __tablename__ = "auctions"
    __table_args__ = (
        Index("idx_auction_status_time", "status", "starts_at", "ends_at"),
        Index("idx_auction_updated", "updated_at"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(
        CHAR(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    starting_price: Mapped[Decimal] = mapped_column(DECIMAL(18, 2), nullable=False)
    min_increment: Mapped[Decimal] = mapped_column(
        DECIMAL(18, 2), nullable=False, default=Decimal("1.00")
    )
    current_price: Mapped[Decimal] = mapped_column(DECIMAL(18, 2), nullable=False)

    # NOTE: intentionally *no* FK constraint on these two columns, matching
    # RTB_Auction_System_Framework.md's raw schema. auctions.current_bid_id
    # would otherwise create a circular FK dependency with bids.auction_id
    # (each table would need to exist before the other).
    current_bid_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    current_winner_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    version: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="UPCOMING")

    starts_at: Mapped[datetime] = mapped_column(
        DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql"), nullable=False
    )
    ends_at: Mapped[datetime] = mapped_column(
        DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql"),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql"),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )
