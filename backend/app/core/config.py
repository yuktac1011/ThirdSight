from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "ThirdSight"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "thirdsight-development-secret-key-change-in-production-min32char"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database
    DATABASE_URL: str = "sqlite:///./thirdsight.db"
    
    # OIDC / Keycloak
    KEYCLOAK_URL: Optional[str] = "http://localhost:8080"
    KEYCLOAK_REALM: str = "thirdsight"
    KEYCLOAK_CLIENT_ID: str = "thirdsight-api"
    KEYCLOAK_CLIENT_SECRET: Optional[str] = None
    
    # Security & CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
    ]

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()

