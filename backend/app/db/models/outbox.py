from datetime import datetime

from sqlalchemy import JSON, BigInteger, DateTime, Index, String, UniqueConstraint
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.utils.time import utcnow


class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    __table_args__ = (
        UniqueConstraint(
            "aggregate_type", "aggregate_id", "aggregate_version", name="uq_outbox_version"
        ),
        Index("idx_outbox_unpublished", "published_at", "created_at"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    aggregate_type: Mapped[str] = mapped_column(String(50), nullable=False)
    aggregate_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    aggregate_version: Mapped[int] = mapped_column(BigInteger, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql"),
        default=utcnow,
        nullable=False,
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql"), nullable=True
    )
