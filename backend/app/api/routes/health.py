from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.observability.health import check_db, check_redis

router = APIRouter()


@router.get("/health/live")
async def live():
    return {"status": "ok"}


@router.get("/health/ready")
async def ready(db: AsyncSession = Depends(get_db)):
    db_ok = await check_db(db)
    redis_ok = await check_redis()
    return {
        "status": "ok" if (db_ok and redis_ok) else "degraded",
        "database": "ok" if db_ok else "unavailable",
        "redis": "ok" if redis_ok else "unavailable",
    }
