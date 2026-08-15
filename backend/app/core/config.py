from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    app_name: str = Field(default="PDF Toolkit")
    app_version: str = Field(default="1.0.0")
    environment: str = Field(default="development")
    debug: bool = Field(default=True)

    api_prefix: str = Field(default="/api/v1")

    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8008)

    frontend_url: str = Field(default="http://localhost:3000")

    log_level: str = Field(default="INFO")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    storage_dir: Path = BASE_DIR / "storage"

    upload_dir: Path = storage_dir / "uploads"
    output_dir: Path = storage_dir / "outputs"
    temp_dir: Path = storage_dir / "temp"

    max_upload_size_mb: int = 50

    preview_dpi: int = 120


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()