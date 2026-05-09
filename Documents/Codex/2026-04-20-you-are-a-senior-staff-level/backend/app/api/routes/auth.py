from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_active_user
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    PasswordResetConfirm,
    PasswordResetConfirmResponse,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    Token,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.services.email_service import send_password_reset_code
from app.services.password_reset_service import PasswordResetService, should_return_dev_code
from app.services.user_service import UserService

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserRead:
    service = UserService(db)
    existing = await service.get_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await service.create(payload, settings.free_plan_code)
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> Token:
    service = UserService(db)
    user = await service.authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return Token(access_token=create_access_token(user.id))


@router.post("/forgot-password", response_model=PasswordResetRequestResponse)
async def forgot_password(payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)) -> PasswordResetRequestResponse:
    service = UserService(db)
    user = await service.get_by_email(payload.email)
    generic_message = "If this email exists, a verification code has been sent."
    if not user:
        return PasswordResetRequestResponse(message=generic_message)

    reset_service = PasswordResetService(db)
    code = await reset_service.create_code(user)
    await send_password_reset_code(user.email, code)
    return PasswordResetRequestResponse(
        message=generic_message,
        verification_code=code if should_return_dev_code() else None,
    )


@router.post("/reset-password", response_model=PasswordResetConfirmResponse)
async def reset_password(payload: PasswordResetConfirm, db: AsyncSession = Depends(get_db)) -> PasswordResetConfirmResponse:
    service = UserService(db)
    user = await service.get_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    reset_service = PasswordResetService(db)
    ok = await reset_service.reset_password(user, payload.code, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    return PasswordResetConfirmResponse(message="Password updated. You can now sign in.")


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_active_user)) -> UserRead:
    return UserRead.model_validate(current_user)
