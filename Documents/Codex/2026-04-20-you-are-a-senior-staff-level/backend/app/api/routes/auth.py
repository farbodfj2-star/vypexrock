"""
Production-grade authentication routes with email verification, OAuth, and security features.
"""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_active_user
from app.core.security import create_access_token, is_gmail_address
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    EmailVerificationConfirm,
    EmailVerificationRequest,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetConfirmResponse,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    PhoneVerificationConfirm,
    PhoneVerificationRequest,
    Token,
    UserCreate,
    UserLogin,
    UserProfileUpdate,
    UserRead,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserRead:
    """
    Register a new user account (Gmail only).
    Sends email verification code.
    """
    # Validate Gmail
    if not is_gmail_address(payload.email):
        raise HTTPException(
            status_code=400,
            detail="Currently only Gmail accounts are supported"
        )
    
    service = AuthService(db)
    
    try:
        user = await service.create_user(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            auth_provider="email",
            email_verified=False,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Send verification email
    try:
        code = await service.send_verification_email(user)
        # In development, return code in logs
        if settings.environment == "development":
            print(f"[DEV] Email verification code for {user.email}: {code}")
    except Exception:
        # Don't fail registration if email fails
        pass
    
    return UserRead.model_validate(user)


@router.post("/verify-email/request")
async def request_email_verification(
    payload: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Request a new email verification code."""
    service = AuthService(db)
    user = await service.get_user_by_email(payload.email)
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If this email exists, a verification code has been sent"}
    
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    try:
        code = await service.send_verification_email(user)
        if settings.environment == "development":
            print(f"[DEV] Email verification code for {user.email}: {code}")
            return {
                "message": "Verification code sent",
                "dev_code": code,
                "expires_in_minutes": settings.email_verification_expire_minutes
            }
    except Exception:
        pass
    
    return {
        "message": "Verification code sent",
        "expires_in_minutes": settings.email_verification_expire_minutes
    }


@router.post("/verify-email/confirm")
async def confirm_email_verification(
    payload: EmailVerificationConfirm,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Verify email with code."""
    service = AuthService(db)
    user = await service.get_user_by_email(payload.email)
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    if user.email_verified:
        return {"message": "Email already verified"}
    
    success = await service.verify_email(user, payload.code)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    return {"message": "Email verified successfully"}


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> Token:
    """
    Login with email and password.
    Returns JWT access token.
    """
    service = AuthService(db)
    user = await service.authenticate(payload.email, payload.password)
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid credentials or account locked"
        )
    
    # Check if email is verified (optional - can be enforced)
    # if not user.email_verified:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Please verify your email before logging in"
    #     )
    
    return Token(access_token=create_access_token(user.id))


@router.post("/forgot-password", response_model=PasswordResetRequestResponse)
async def forgot_password(
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
) -> PasswordResetRequestResponse:
    """Request password reset code."""
    service = AuthService(db)
    user = await service.get_user_by_email(payload.email)
    
    generic_message = "If this email exists, a verification code has been sent"
    
    if not user:
        return PasswordResetRequestResponse(
            message=generic_message,
            expires_in_minutes=settings.password_reset_expire_minutes
        )
    
    try:
        code = await service.send_password_reset_email(user)
        if settings.environment == "development":
            print(f"[DEV] Password reset code for {user.email}: {code}")
            return PasswordResetRequestResponse(
                message=generic_message,
                expires_in_minutes=settings.password_reset_expire_minutes,
                verification_code=code
            )
    except Exception:
        pass
    
    return PasswordResetRequestResponse(
        message=generic_message,
        expires_in_minutes=settings.password_reset_expire_minutes
    )


@router.post("/reset-password", response_model=PasswordResetConfirmResponse)
async def reset_password(
    payload: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
) -> PasswordResetConfirmResponse:
    """Reset password with verification code."""
    service = AuthService(db)
    user = await service.get_user_by_email(payload.email)
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code"
        )
    
    success = await service.reset_password(user, payload.code, payload.new_password)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code"
        )
    
    return PasswordResetConfirmResponse(
        message="Password updated successfully. You can now sign in."
    )


@router.post("/change-password")
async def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Change password (requires current password)."""
    service = AuthService(db)
    success = await service.change_password(
        current_user,
        payload.current_password,
        payload.new_password
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    return {"message": "Password changed successfully"}


@router.post("/phone/add")
async def add_phone_number(
    payload: PhoneVerificationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Add phone number and send verification code."""
    service = AuthService(db)
    
    try:
        code = await service.add_phone_number(current_user, payload.phone_number)
        if settings.environment == "development":
            print(f"[DEV] Phone verification code for {current_user.email}: {code}")
            return {
                "message": "Verification code sent",
                "dev_code": code,
                "expires_in_minutes": settings.phone_verification_expire_minutes
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "Verification code sent",
        "expires_in_minutes": settings.phone_verification_expire_minutes
    }


@router.post("/phone/verify")
async def verify_phone_number(
    payload: PhoneVerificationConfirm,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Verify phone number with code."""
    service = AuthService(db)
    success = await service.verify_phone(current_user, payload.code)
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code"
        )
    
    return {"message": "Phone number verified successfully"}


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_active_user)) -> UserRead:
    """Get current user profile."""
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Update current user profile."""
    service = AuthService(db)
    user = await service.update_profile(current_user, full_name=payload.full_name)
    return UserRead.model_validate(user)


@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Upload user avatar."""
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
    service = AuthService(db)
    user = await service.update_profile(current_user, avatar_url=avatar_url)
    return UserRead.model_validate(user)


@router.get("/avatars/{filename}")
async def get_avatar(filename: str):
    """Get user avatar file."""
    from fastapi.responses import FileResponse

    path = Path(settings.avatar_upload_dir) / Path(filename).name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(path)


# OAuth routes (structure ready for implementation)

@router.get("/google/login")
async def google_login():
    """Initiate Google OAuth flow."""
    if not settings.google_client_id:
        raise HTTPException(
            status_code=501,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
        )
    
    # TODO: Implement Google OAuth redirect
    from urllib.parse import urlencode
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback."""
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    
    # TODO: Exchange code for tokens, get user info, create/login user
    raise HTTPException(
        status_code=501,
        detail="Google OAuth callback implementation pending. See backend/app/api/routes/auth.py"
    )


@router.get("/github/login")
async def github_login():
    """Initiate GitHub OAuth flow."""
    if not settings.github_client_id:
        raise HTTPException(
            status_code=501,
            detail="GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables."
        )
    
    from urllib.parse import urlencode
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "user:email"
    }
    auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle GitHub OAuth callback."""
    if not settings.github_client_id:
        raise HTTPException(status_code=501, detail="GitHub OAuth not configured")
    
    # TODO: Exchange code for tokens, get user info, create/login user
    raise HTTPException(
        status_code=501,
        detail="GitHub OAuth callback implementation pending. See backend/app/api/routes/auth.py"
    )


@router.get("/apple/login")
async def apple_login():
    """Initiate Apple ID OAuth flow."""
    if not settings.apple_client_id:
        raise HTTPException(
            status_code=501,
            detail="Apple ID OAuth is not configured. Please set APPLE_CLIENT_ID and related environment variables."
        )
    
    # TODO: Implement Apple OAuth redirect
    raise HTTPException(
        status_code=501,
        detail="Apple ID OAuth implementation pending. See backend/app/api/routes/auth.py"
    )


@router.post("/apple/callback")
async def apple_callback(db: AsyncSession = Depends(get_db)):
    """Handle Apple ID OAuth callback."""
    if not settings.apple_client_id:
        raise HTTPException(status_code=501, detail="Apple ID OAuth not configured")
    
    # TODO: Verify Apple JWT, get user info, create/login user
    raise HTTPException(
        status_code=501,
        detail="Apple ID OAuth callback implementation pending. See backend/app/api/routes/auth.py"
    )
