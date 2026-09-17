from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Looked up relative to the backend/ working directory, so the repo's
    # single root .env (copied from .env.example) is the source of truth.
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = "development"
    DATABASE_URL: str = "mysql+asyncmy://auction_user:auction_pass@localhost:3306/auction_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # If true, the backend creates its own tables on startup (idempotent
    # CREATE TABLE IF NOT EXISTS) so `docker compose up -d && uvicorn ...`
    # is enough to get a working schema with zero manual migration step.
    # Alembic (backend/alembic/) is still there for real schema changes.
    AUTO_CREATE_SCHEMA: bool = True

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    OUTBOX_POLL_INTERVAL_SECONDS: float = 0.25

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
