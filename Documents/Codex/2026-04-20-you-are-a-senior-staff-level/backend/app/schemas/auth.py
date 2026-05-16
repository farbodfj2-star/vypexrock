from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import ORMBase, Timestamped


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    
    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        if not v.lower().endswith("@gmail.com"):
            raise ValueError("Only Gmail addresses are supported")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class EmailVerificationRequest(BaseModel):
    email: EmailStr


class EmailVerificationConfirm(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetRequestResponse(BaseModel):
    message: str
    expires_in_minutes: int
    verification_code: str | None = None


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetConfirmResponse(BaseModel):
    message: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class PhoneVerificationRequest(BaseModel):
    phone_number: str = Field(min_length=10, max_length=20)


class PhoneVerificationConfirm(BaseModel):
    code: str = Field(min_length=6, max_length=6)


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
    email_verified: bool
    phone_verified: bool
    auth_provider: str | None
    phone_number: str | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)


class OAuthCallbackResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

