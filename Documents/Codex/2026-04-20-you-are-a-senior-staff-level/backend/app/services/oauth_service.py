"""
Production OAuth service for Google, GitHub, and Apple authentication.
"""
import httpx
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, is_gmail_address
from app.models.subscription import Plan, Subscription
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.avatar_service import generate_avatar_url


class OAuthService:
    """Handles OAuth authentication for multiple providers."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.auth_service = AuthService(db)
    
    async def google_exchange_code(self, code: str) -> dict:
        """Exchange Google authorization code for tokens."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    
    async def google_get_user_info(self, access_token: str) -> dict:
        """Get Google user information."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    
    async def google_authenticate(self, code: str) -> tuple[User, str]:
        """
        Authenticate user with Google OAuth.
        Returns (user, jwt_token).
        """
        # Exchange code for tokens
        token_data = await self.google_exchange_code(code)
        access_token = token_data["access_token"]
        
        # Get user info
        user_info = await self.google_get_user_info(access_token)
        
        google_id = user_info["id"]
        email = user_info["email"]
        full_name = user_info.get("name")
        avatar_url = user_info.get("picture")
        
        # Validate Gmail
        if not is_gmail_address(email):
            raise ValueError("Only Gmail accounts are supported")
        
        # Check if user exists by Google ID
        user = await self.auth_service.get_user_by_google_id(google_id)
        
        if not user:
            # Check if user exists by email
            user = await self.auth_service.get_user_by_email(email)
            
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                user.auth_provider = "google"
                if not user.avatar_url and avatar_url:
                    user.avatar_url = avatar_url
                await self.db.commit()
            else:
                # Create new user
                user = await self.auth_service.create_user(
                    email=email,
                    password=None,  # OAuth users don't have passwords
                    full_name=full_name,
                    avatar_url=avatar_url,
                    auth_provider="google",
                    google_id=google_id,
                    email_verified=True,  # Google emails are pre-verified
                )
        
        # Update last login
        user.last_login_at = datetime.now(UTC)
        await self.db.commit()
        
        # Create JWT token
        jwt_token = create_access_token(user.id)
        
        return user, jwt_token
    
    async def github_exchange_code(self, code: str) -> dict:
        """Exchange GitHub authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "code": code,
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "redirect_uri": settings.github_redirect_uri,
                },
                headers={"Accept": "application/json"},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    
    async def github_get_user_info(self, access_token: str) -> dict:
        """Get GitHub user information."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    
    async def github_get_user_emails(self, access_token: str) -> list[dict]:
        """Get GitHub user emails."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    
    async def github_authenticate(self, code: str) -> tuple[User, str]:
        """
        Authenticate user with GitHub OAuth.
        Returns (user, jwt_token).
        """
        # Exchange code for access token
        token_data = await self.github_exchange_code(code)
        access_token = token_data["access_token"]
        
        # Get user info
        user_info = await self.github_get_user_info(access_token)
        emails = await self.github_get_user_emails(access_token)
        
        github_id = str(user_info["id"])
        full_name = user_info.get("name")
        avatar_url = user_info.get("avatar_url")
        
        # Find primary Gmail address
        gmail_email = None
        for email_data in emails:
            email = email_data["email"]
            if is_gmail_address(email) and email_data.get("primary", False):
                gmail_email = email
                break
        
        # If no primary Gmail, find any Gmail
        if not gmail_email:
            for email_data in emails:
                email = email_data["email"]
                if is_gmail_address(email):
                    gmail_email = email
                    break
        
        if not gmail_email:
            raise ValueError("No Gmail address found in GitHub account. Please add a Gmail address to your GitHub account.")
        
        # Check if user exists by GitHub ID
        user = await self.auth_service.get_user_by_github_id(github_id)
        
        if not user:
            # Check if user exists by email
            user = await self.auth_service.get_user_by_email(gmail_email)
            
            if user:
                # Link GitHub account to existing user
                user.github_id = github_id
                if user.auth_provider == "email":
                    user.auth_provider = "github"
                if not user.avatar_url and avatar_url:
                    user.avatar_url = avatar_url
                await self.db.commit()
            else:
                # Create new user
                user = await self.auth_service.create_user(
                    email=gmail_email,
                    password=None,
                    full_name=full_name,
                    avatar_url=avatar_url,
                    auth_provider="github",
                    github_id=github_id,
                    email_verified=True,  # GitHub emails are verified
                )
        
        # Update last login
        user.last_login_at = datetime.now(UTC)
        await self.db.commit()
        
        # Create JWT token
        jwt_token = create_access_token(user.id)
        
        return user, jwt_token
    
    async def apple_authenticate(self, id_token: str, code: str) -> tuple[User, str]:
        """
        Authenticate user with Apple ID.
        Returns (user, jwt_token).
        
        Note: Apple Sign In requires JWT verification which needs the Apple public key.
        This is a simplified implementation. For production, use a library like
        python-jose or PyJWT with proper Apple public key verification.
        """
        # TODO: Implement Apple ID token verification
        # For now, raise not implemented
        raise NotImplementedError(
            "Apple Sign In requires additional setup. "
            "Please configure Apple Developer credentials and implement JWT verification."
        )
