from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.alerts import AlertCreate, AlertLogRead, AlertRead, AlertUpdate
from app.services.alert_service import AlertService

router = APIRouter()


@router.get("", response_model=list[AlertRead])
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[AlertRead]:
    alerts = await AlertService(db).list_for_user(current_user.id)
    return [AlertRead.model_validate(alert) for alert in alerts]


@router.post("", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AlertRead:
    alert = await AlertService(db).create(current_user.id, payload)
    return AlertRead.model_validate(alert)


@router.patch("/{alert_id}", response_model=AlertRead)
async def update_alert(
    alert_id: int,
    payload: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AlertRead:
    alert = await AlertService(db).update(current_user.id, alert_id, payload)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertRead.model_validate(alert)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    await AlertService(db).delete(current_user.id, alert_id)


@router.get("/logs", response_model=list[AlertLogRead])
async def alert_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[AlertLogRead]:
    logs = await AlertService(db).logs_for_user(current_user.id)
    return [AlertLogRead.model_validate(log) for log in logs]
