from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    project_name: str = "Crypto Signal Platform"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"
    secret_key: str = Field(default="change-me", alias="SECRET_KEY")
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    cors_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$|^https://([a-z0-9-]+\.)?vercel\.app$"

    database_url: str = Field(alias="DATABASE_URL")
    redis_url: str = Field(alias="REDIS_URL")

    binance_rest_url: str = "https://api.binance.com"
    binance_ws_url: str = "wss://stream.binance.com:9443/stream"
    coingecko_url: str = "https://api.coingecko.com/api/v3"

    tracked_symbols: list[str] = [
        "BTCUSDT",
        "ETHUSDT",
        "SOLUSDT",
        "BNBUSDT",
        "XRPUSDT",
        "DOGEUSDT",
        "ADAUSDT",
        "AVAXUSDT",
        "LINKUSDT",
        "MATICUSDT",
        "DOTUSDT",
        "ATOMUSDT",
        "LTCUSDT",
        "NEARUSDT",
        "TRXUSDT",
        "SUIUSDT",
        "APTUSDT",
        "UNIUSDT",
        "BCHUSDT",
        "PEPEUSDT",
        "SHIBUSDT",
        "TONUSDT",
        "FILUSDT",
        "AAVEUSDT",
        "INJUSDT",
        "ARBUSDT",
        "OPUSDT",
    ]
    tracked_metals: list[str] = ["XAUUSD", "XAGUSD", "USOIL", "UKOIL"]
    market_poll_interval_seconds: int = 1
    signal_refresh_seconds: int = 15
    alert_refresh_seconds: int = 45
    websocket_history_limit: int = 200

    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    telegram_signal_enabled: bool = True
    telegram_market_update_enabled: bool = True
    telegram_update_interval_minutes: int = 60
    telegram_market_update_interval_minutes: int = 60
    telegram_signal_interval_minutes: int = 60
    telegram_signal_check_seconds: int = 3600
    telegram_signal_fast_check_seconds: int = 900
    telegram_signal_min_confidence: int = 80
    telegram_signal_strong_confidence: int = 88
    telegram_elite_signal_confidence: int = 92
    telegram_watchlist_min_confidence: int = 50
    telegram_early_signal_min_confidence: int = 66
    telegram_signal_min_risk_reward: float = 1.6
    telegram_signal_cooldown_minutes: int = 360
    telegram_fast_timeframe: str = "5m"
    telegram_signal_timeframes: str = "15m"
    telegram_signal_timeframe: str = "15m"
    telegram_confirmation_timeframe: str = "1h"
    telegram_trend_timeframe: str = "4h"
    telegram_signal_expiry_hours: int = 24
    telegram_tracking_interval_minutes: int = 15
    telegram_signal_running_update_minutes: int = 240
    telegram_market_status_interval_minutes: int = 60
    telegram_watchlist_cooldown_minutes: int = 90
    telegram_command_poll_seconds: int = 10
    telegram_signal_risk_percent: float = 1.0
    telegram_signal_example_account_size: float = 10000.0
    telegram_market_top_assets_count: int = 15
    telegram_dynamic_market_discovery_enabled: bool = True
    telegram_hot_symbol_count: int = 80
    telegram_max_scan_symbols: int = 60
    telegram_min_hot_quote_volume: float = 5_000_000.0
    telegram_signal_symbols: str = "BTCUSDT,ETHUSDT,SOLUSDT,XRPUSDT,DOGEUSDT,BNBUSDT,ADAUSDT,AVAXUSDT,LINKUSDT,SUIUSDT,TONUSDT,PEPEUSDT,SHIBUSDT,INJUSDT,WIFUSDT,BONKUSDT"
    telegram_market_update_symbols: str = "BTCUSDT,ETHUSDT,SOLUSDT,XRPUSDT,DOGEUSDT,BNBUSDT,ADAUSDT,AVAXUSDT,LINKUSDT,SUIUSDT,TONUSDT,PEPEUSDT,SHIBUSDT,INJUSDT,WIFUSDT,BONKUSDT"
    ai_provider: str = "auto"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.5"
    openai_enable_web_search: bool = True
    nvidia_api_key: str | None = None
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "meta/llama-3.1-8b-instruct"

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "security@vypexrock.com"
    smtp_from_name: str = "Vypexrock Security"
    smtp_use_tls: bool = True

    free_plan_code: str = "free"
    premium_plan_code: str = "pro"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
