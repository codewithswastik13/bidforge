"""Timestamp convention for the whole backend.

MySQL's DATETIME type has no timezone concept, so every datetime that
touches the database is normalized to *naive UTC*. Never compare a naive
and a timezone-aware datetime directly (Python raises TypeError) --
always pass incoming values through `to_naive_utc` first. The frontend
knows to treat every timestamp coming back from the API as UTC (see
frontend/src/lib/format.ts: parseUtc).
"""
from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt
