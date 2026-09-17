from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.models.user import User
from app.db.session import get_db

# tokenUrl is only used to populate Swagger's "Authorize" dialog; our
# login endpoint takes JSON, not form-encoded data -- that's fine, this
# dependency only ever reads the Authorization header.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error
    try:
        payload = decode_access_token(token)
        public_id: str | None = payload.get("sub")
    except Exception:
        raise credentials_error
    if not public_id:
        raise credentials_error

    result = await db.execute(select(User).where(User.public_id == public_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_error
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
