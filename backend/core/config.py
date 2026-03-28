from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "DataPulse API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost/datapulse"

    # Redis (cache enrichissements)
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_SECONDS: int = 86400  # 24h — on réutilise les résultats cachés

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Sources gratuites (actives maintenant)
    CLEARBIT_AUTOCOMPLETE_URL: str = "https://autocomplete.clearbit.com/v1/companies/suggest"
    OPENCORPORATES_URL: str = "https://api.opencorporates.com/v0.4/companies/search"
    DUCKDUCKGO_URL: str = "https://api.duckduckgo.com"

    # Sources payantes (à activer plus tard)
    HUNTER_API_KEY: Optional[str] = None       # https://hunter.io
    PROXYCURL_API_KEY: Optional[str] = None    # LinkedIn enrichment
    OPENCORP_API_KEY: Optional[str] = None     # OpenCorporates premium

    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Email
    RESEND_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@datapulse.io"

    class Config:
        env_file = ".env"

settings = Settings()
