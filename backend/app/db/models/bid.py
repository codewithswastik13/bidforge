import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CHAR,
    DECIMAL,
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.utils.time import utcnow


class Bid(Base):
    __tablename__ = "bids"
    __table_args__ = (
        UniqueConstraint("auction_id", "auction_version", name="uq_bid_version"),
        UniqueConstraint("auction_id", "idempotency_key", name="uq_bid_idempotency"),
        Index("idx_bid_auction_time", "auction_id", "created_at"),
        Index("idx_bid_auction_version", "auction_id", "auction_version"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(
        CHAR(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4())
    )
    auction_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("auctions.id"), nullable=False)
    bidder_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(DECIMAL(18, 2), nullable=False)
    auction_version: Mapped[int] = mapped_column(BigInteger, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(CHAR(36), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql"),
        default=utcnow,
        nullable=False,
    )
