from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.realtime.redis import get_redis


async def check_db(db: AsyncSession) -> bool:
    try:
        await db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def check_redis() -> bool:
    try:
        await get_redis().ping()
        return True
    except Exception:
        return False
