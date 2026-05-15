import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
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
    UserProfileUpdate,
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


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    service = UserService(db)
    user = await service.update_profile(current_user, full_name=payload.full_name)
    return UserRead.model_validate(user)


@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Avatar must be an image file")

    upload_dir = Path(settings.avatar_upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "avatar.png").suffix or ".png"
    filename = f"user_{current_user.id}_{uuid.uuid4().hex[:10]}{suffix}"
    destination = upload_dir / filename
    content = await file.read()
    if len(content) > 4_000_000:
        raise HTTPException(status_code=400, detail="Avatar file too large (max 4MB)")
    destination.write_bytes(content)

    avatar_url = f"{settings.api_v1_prefix}/auth/avatars/{filename}"
    service = UserService(db)
    user = await service.update_profile(current_user, avatar_url=avatar_url)
    return UserRead.model_validate(user)


@router.get("/avatars/{filename}")
async def get_avatar(filename: str):
    from fastapi.responses import FileResponse

    path = Path(settings.avatar_upload_dir) / Path(filename).name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(path)
