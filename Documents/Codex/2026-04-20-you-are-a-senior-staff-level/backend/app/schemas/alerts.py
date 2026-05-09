from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import Timestamped


class AlertCreate(BaseModel):
    symbol: str = Field(min_length=3, max_length=24)
    condition_type: str
    direction: str
    threshold_value: float | None = None
    cool_down_minutes: int = Field(default=30, ge=1, le=1440)


class AlertUpdate(BaseModel):
    is_active: bool | None = None
    threshold_value: float | None = None
    cool_down_minutes: int | None = Field(default=None, ge=1, le=1440)


class AlertRead(Timestamped):
    id: int
    symbol: str
    condition_type: str
    direction: str
    threshold_value: float | None
    is_active: bool
    cool_down_minutes: int
    last_triggered_at: datetime | None


class AlertLogRead(Timestamped):
    id: int
    alert_id: int
    user_id: int
    symbol: str
    message: str
    delivery_status: str
