"""Prometheus metrics + a tiny in-process JSON mirror.

We keep two views of the same numbers:
  - Prometheus Counter/Histogram/Gauge objects, scraped at GET /metrics.
  - `METRICS_SNAPSHOT`, a plain dataclass the frontend's Admin/Stress
    Arena pages can read cheaply as JSON via GET /api/v1/admin/metrics/live
    without having to parse the Prometheus text format in the browser.
"""
from dataclasses import dataclass, field
from threading import Lock

from prometheus_client import Counter, Gauge, Histogram

BID_ATTEMPTS = Counter("bid_attempts_total", "Total bid attempts", ["result"])
BID_LATENCY = Histogram(
    "bid_latency_seconds",
    "Bid transaction latency in seconds",
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5),
)
DB_LOCK_WAITS = Counter("db_lock_waits_total", "Lock wait timeouts retried")
DB_DEADLOCKS = Counter("db_deadlocks_total", "Deadlocks detected and retried")
OUTBOX_BACKLOG = Gauge("outbox_unpublished_count", "Unpublished outbox events")
WS_CONNECTIONS = Gauge("ws_connections_total", "Active WebSocket connections")

_REJECTED_RESULTS = {"too_low", "not_live", "ended", "not_found"}


@dataclass
class _Snapshot:
    accepted: int = 0
    rejected: int = 0
    errors: int = 0
    lock_waits: int = 0
    deadlocks: int = 0
    ws_connections: int = 0
    _lock: Lock = field(default_factory=Lock, repr=False, compare=False)

    def record_bid(self, result: str) -> None:
        with self._lock:
            if result in ("accepted", "idempotent_replay", "idempotent_replay_race"):
                self.accepted += 1
            elif result in _REJECTED_RESULTS:
                self.rejected += 1
            else:
                self.errors += 1

    def record_lock_wait(self) -> None:
        with self._lock:
            self.lock_waits += 1

    def record_deadlock(self) -> None:
        with self._lock:
            self.deadlocks += 1

    def set_ws_connections(self, n: int) -> None:
        with self._lock:
            self.ws_connections = n

    def as_dict(self) -> dict:
        with self._lock:
            return {
                "accepted_bids": self.accepted,
                "rejected_bids": self.rejected,
                "errors": self.errors,
                "db_lock_waits": self.lock_waits,
                "db_deadlocks": self.deadlocks,
                "ws_connections": self.ws_connections,
            }


METRICS_SNAPSHOT = _Snapshot()
