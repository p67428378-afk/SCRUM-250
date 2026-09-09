import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hospital Management System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hospital.db")
    SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "hospital-super-secret-key-change-in-production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    @property
    def allowed_origins(self) -> List[str]:
        raw = os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
        )
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


settings = Settings()
