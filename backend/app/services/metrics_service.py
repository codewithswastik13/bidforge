from app.observability.metrics import METRICS_SNAPSHOT


def get_live_snapshot() -> dict:
    return METRICS_SNAPSHOT.as_dict()
