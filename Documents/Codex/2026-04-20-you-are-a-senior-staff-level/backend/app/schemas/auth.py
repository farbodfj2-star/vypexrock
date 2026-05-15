from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMBase, Timestamped


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetRequestResponse(BaseModel):
    message: str
    expires_in_minutes: int = 10
    verification_code: str | None = None


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetConfirmResponse(BaseModel):
    message: str


class Token(ORMBase):
    access_token: str
    token_type: str = "bearer"


class UserRead(Timestamped):
    id: int
    email: EmailStr
    full_name: str | None
    avatar_url: str | None = None
    is_active: bool
    is_premium: bool


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
