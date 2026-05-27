from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE_PATH = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "WhatsApp Sales Bot"
    app_timezone: str = "Asia/Kolkata"
    database_url: str = Field(alias="DATABASE_URL")
    whatsapp_access_token: str | None = Field(default=None, alias="WHATSAPP_ACCESS_TOKEN")
    whatsapp_phone_number_id: str | None = Field(
        default=None,
        alias="WHATSAPP_PHONE_NUMBER_ID",
    )
    whatsapp_verify_token: str | None = Field(default=None, alias="WHATSAPP_VERIFY_TOKEN")
    guard_rate_limit: int = Field(default=120, alias="GUARD_RATE_LIMIT")
    guard_rate_window_seconds: int = Field(
        default=60,
        alias="GUARD_RATE_WINDOW_SECONDS",
    )
    sql_echo: bool = Field(default=False, alias="SQL_ECHO")
    whatsapp_app_secret: str | None = Field(default=None, alias="WHATSAPP_APP_SECRET")
    api_key: str | None = Field(default=None, alias="API_KEY")


@lru_cache
def get_settings() -> Settings:
    return Settings()
