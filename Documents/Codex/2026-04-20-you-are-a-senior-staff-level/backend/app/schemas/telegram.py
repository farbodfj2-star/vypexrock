from pydantic import BaseModel, Field

from app.schemas.common import Timestamped


class TelegramLinkRequest(BaseModel):
    chat_id: str = Field(min_length=1, max_length=64)
    username: str | None = Field(default=None, max_length=128)
    bot_token: str | None = Field(default=None, max_length=256)


class TelegramAccountRead(Timestamped):
    id: int
    user_id: int
    chat_id: str
    username: str | None
    bot_token_configured: bool


class TelegramAutomationSettingsRead(BaseModel):
    bot_configured: bool
    env_bot_configured: bool
    user_bot_configured: bool
    env_chat_configured: bool
    linked_chat_configured: bool
    enabled: bool
    signal_alerts_enabled: bool
    market_update_enabled: bool
    interval_minutes: int
    market_update_interval_minutes: int
    signal_interval_minutes: int
    top_assets_count: int
    min_confidence: int
    min_risk_reward: float
    cooldown_minutes: int
    check_interval_seconds: int
    timeframe: str
    symbols: list[str]
    market_symbols: list[str]
    last_sent_at: str | None = None
    last_market_update_sent_at: str | None = None
    last_best_setup_sent_at: str | None = None
    market_message_preview: str | None = None
    best_setup_message_preview: str | None = None
    recent_logs: list[dict] = Field(default_factory=list)


class TelegramTestResponse(BaseModel):
    status: str
    detail: str
    delivery: dict | None = None
