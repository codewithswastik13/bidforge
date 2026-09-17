import uuid
from datetime import datetime

from sqlalchemy import CHAR, DateTime, String
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.utils.time import utcnow


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(
        CHAR(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4())
    )
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="BIDDER")
    created_at: Mapped[datetime] = mapped_column(
        DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql"),
        default=utcnow,
        nullable=False,
    )
