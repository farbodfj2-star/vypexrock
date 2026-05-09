from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.subscription import Plan, Subscription
from app.models.user import User
from app.schemas.auth import UserCreate


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, payload: UserCreate, free_plan_code: str) -> User:
        user = User(
            email=payload.email.lower(),
            hashed_password=get_password_hash(payload.password),
            full_name=payload.full_name,
        )
        self.db.add(user)
        await self.db.flush()

        plan = await self.db.scalar(select(Plan).where(Plan.code == free_plan_code))
        if plan:
            self.db.add(Subscription(user_id=user.id, plan_id=plan.id, status="active"))

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate(self, email: str, password: str) -> User | None:
        user = await self.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user
