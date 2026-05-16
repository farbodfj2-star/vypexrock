"""
Production-grade authentication service with email verification, OAuth, and security features.
"""
from datetime import UTC, datetime, timedelta
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    generate_secure_token,
    generate_verification_code,
    get_password_hash,
    hash_token,
    is_gmail_address,
    verify_password,
    verify_token,
)
from app.models.subscription import Plan, Subscription
from app.models.user import User
from app.schemas.auth import UserCreate
from app.services.avatar_service import generate_avatar_url
from app.services.email_service import send_password_reset_email, send_verification_email


class AuthService:
    """Handles all authentication operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email address."""
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: int) -> User | None:
        """Get user by ID."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    async def get_user_by_google_id(self, google_id: str) -> User | None:
        """Get user by Google ID."""
        result = await self.db.execute(select(User).where(User.google_id == google_id))
        return result.scalar_one_or_none()
    
    async def get_user_by_github_id(self, github_id: str) -> User | None:
        """Get user by GitHub ID."""
        result = await self.db.execute(select(User).where(User.github_id == github_id))
        return result.scalar_one_or_none()
    
    async def get_user_by_apple_id(self, apple_id: str) -> User | None:
        """Get user by Apple ID."""
        result = await self.db.execute(select(User).where(User.apple_id == apple_id))
        return result.scalar_one_or_none()
    
    async def create_user(
        self,
        email: str,
        password: str | None = None,
        full_name: str | None = None,
        avatar_url: str | None = None,
        auth_provider: str = "email",
        google_id: str | None = None,
        github_id: str | None = None,
        apple_id: str | None = None,
        email_verified: bool = False,
    ) -> User:
        """Create a new user account."""
        # Validate Gmail requirement
        if not is_gmail_address(email):
            raise ValueError("Only Gmail addresses are supported")
        
        # Check if email already exists
        existing = await self.get_user_by_email(email)
        if existing:
            raise ValueError("Email already registered")
        
        # Create user
        user = User(
            email=email.lower(),
            hashed_password=get_password_hash(password) if password else None,
            full_name=full_name,
            avatar_url=avatar_url or generate_avatar_url(email.lower()),
            auth_provider=auth_provider,
            google_id=google_id,
            github_id=github_id,
            apple_id=apple_id,
            email_verified=email_verified,
        )
        
        self.db.add(user)
        await self.db.flush()
        
        # Add free plan subscription
        plan = await self.db.scalar(select(Plan).where(Plan.code == settings.free_plan_code))
        if plan:
            self.db.add(Subscription(user_id=user.id, plan_id=plan.id, status="active"))
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def send_verification_email(self, user: User) -> str:
        """Generate and send email verification code."""
        code = generate_verification_code(6)
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.email_verification_expire_minutes)
        
        user.email_verification_token_hash = hash_token(code)
        user.email_verification_expires_at = expires_at
        await self.db.commit()
        
        await send_verification_email(user.email, code)
        return code
    
    async def verify_email(self, user: User, code: str) -> bool:
        """Verify email with code."""
        if not user.email_verification_token_hash:
            return False
        
        if not user.email_verification_expires_at:
            return False
        
        if datetime.now(UTC) > user.email_verification_expires_at:
            return False
        
        if not verify_token(code, user.email_verification_token_hash):
            return False
        
        user.email_verified = True
        user.email_verification_token_hash = None
        user.email_verification_expires_at = None
        await self.db.commit()
        return True
    
    async def send_password_reset_email(self, user: User) -> str:
        """Generate and send password reset code."""
        code = generate_verification_code(6)
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.password_reset_expire_minutes)
        
        user.password_reset_token_hash = hash_token(code)
        user.password_reset_expires_at = expires_at
        await self.db.commit()
        
        await send_password_reset_email(user.email, code)
        return code
    
    async def reset_password(self, user: User, code: str, new_password: str) -> bool:
        """Reset password with verification code."""
        if not user.password_reset_token_hash:
            return False
        
        if not user.password_reset_expires_at:
            return False
        
        if datetime.now(UTC) > user.password_reset_expires_at:
            return False
        
        if not verify_token(code, user.password_reset_token_hash):
            return False
        
        user.hashed_password = get_password_hash(new_password)
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        user.failed_login_attempts = 0
        user.account_locked_until = None
        await self.db.commit()
        return True
    
    async def authenticate(self, email: str, password: str) -> User | None:
        """Authenticate user with email and password."""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        
        # Check if account is locked
        if user.account_locked_until and datetime.now(UTC) < user.account_locked_until:
            return None
        
        # Clear lockout if expired
        if user.account_locked_until and datetime.now(UTC) >= user.account_locked_until:
            user.account_locked_until = None
            user.failed_login_attempts = 0
        
        # Verify password
        if not user.hashed_password or not verify_password(password, user.hashed_password):
            # Increment failed attempts
            user.failed_login_attempts += 1
            
            # Lock account if too many failures
            if user.failed_login_attempts >= settings.max_failed_login_attempts:
                user.account_locked_until = datetime.now(UTC) + timedelta(
                    minutes=settings.account_lockout_duration_minutes
                )
            
            await self.db.commit()
            return None
        
        # Successful login - reset failed attempts and update last login
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.last_login_at = datetime.now(UTC)
        await self.db.commit()
        
        return user
    
    async def update_profile(
        self,
        user: User,
        *,
        full_name: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        """Update user profile."""
        if full_name is not None:
            user.full_name = full_name
        if avatar_url is not None:
            user.avatar_url = avatar_url
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        """Change user password."""
        if not user.hashed_password:
            return False
        
        if not verify_password(current_password, user.hashed_password):
            return False
        
        user.hashed_password = get_password_hash(new_password)
        await self.db.commit()
        return True
    
    async def add_phone_number(self, user: User, phone_number: str) -> str:
        """Add phone number and send verification code."""
        code = generate_verification_code(6)
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.phone_verification_expire_minutes)
        
        user.phone_number = phone_number
        user.phone_verified = False
        user.phone_verification_code_hash = hash_token(code)
        user.phone_verification_expires_at = expires_at
        await self.db.commit()
        
        # TODO: Send SMS via Twilio/Firebase
        return code
    
    async def verify_phone(self, user: User, code: str) -> bool:
        """Verify phone number with code."""
        if not user.phone_verification_code_hash:
            return False
        
        if not user.phone_verification_expires_at:
            return False
        
        if datetime.now(UTC) > user.phone_verification_expires_at:
            return False
        
        if not verify_token(code, user.phone_verification_code_hash):
            return False
        
        user.phone_verified = True
        user.phone_verification_code_hash = None
        user.phone_verification_expires_at = None
        await self.db.commit()
        return True
