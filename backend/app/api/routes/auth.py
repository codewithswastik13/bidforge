from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register(db, body.username, body.password)
    token = create_access_token(user.public_id, user.role)
    return TokenResponse(
        access_token=token, user_id=user.public_id, username=user.username, role=user.role
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.authenticate(db, body.username, body.password)
    token = create_access_token(user.public_id, user.role)
    return TokenResponse(
        access_token=token, user_id=user.public_id, username=user.username, role=user.role
    )


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return UserResponse(user_id=user.public_id, username=user.username, role=user.role)
