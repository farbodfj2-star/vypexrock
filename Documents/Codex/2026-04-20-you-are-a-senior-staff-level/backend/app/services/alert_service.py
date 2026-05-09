from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertLog
from app.schemas.alerts import AlertCreate, AlertUpdate


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(self, user_id: int) -> list[Alert]:
        result = await self.db.execute(select(Alert).where(Alert.user_id == user_id).order_by(Alert.created_at.desc()))
        return list(result.scalars().all())

    async def create(self, user_id: int, payload: AlertCreate) -> Alert:
        alert = Alert(user_id=user_id, symbol=payload.symbol.upper(), **payload.model_dump(exclude={"symbol"}))
        self.db.add(alert)
        await self.db.commit()
        await self.db.refresh(alert)
        return alert

    async def update(self, user_id: int, alert_id: int, payload: AlertUpdate) -> Alert | None:
        result = await self.db.execute(select(Alert).where(Alert.id == alert_id, Alert.user_id == user_id))
        alert = result.scalar_one_or_none()
        if not alert:
            return None
        for key, value in payload.model_dump(exclude_none=True).items():
            setattr(alert, key, value)
        await self.db.commit()
        await self.db.refresh(alert)
        return alert

    async def delete(self, user_id: int, alert_id: int) -> None:
        await self.db.execute(delete(Alert).where(Alert.user_id == user_id, Alert.id == alert_id))
        await self.db.commit()

    async def logs_for_user(self, user_id: int, limit: int = 20) -> list[AlertLog]:
        result = await self.db.execute(
            select(AlertLog).where(AlertLog.user_id == user_id).order_by(AlertLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
