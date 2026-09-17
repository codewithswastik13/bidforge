import logging
import sys

from app.core.config import settings

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_configured = False


def setup_logging() -> None:
    global _configured
    if _configured:
        return
    level = logging.DEBUG if settings.ENV == "development" else logging.INFO
    logging.basicConfig(level=level, format=_LOG_FORMAT, stream=sys.stdout)
    for noisy in ("sqlalchemy.engine", "asyncio", "aiosqlite"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    _configured = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
