"""
Core configuration for Grid Brain application.
"""
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings."""
    # Forcing a reload to fix a potential caching issue with Pydantic settings
    
    # Application
    app_name: str = Field(default="Grid Brain", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # Server
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    encryption_key: str = Field(..., env="ENCRYPTION_KEY")
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # Database - Supabase
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(..., env="SUPABASE_ANON_KEY")
    supabase_service_key: str = Field(..., env="SUPABASE_SERVICE_KEY")
    
    # AI Services
    anthropic_api_key: str = Field(..., env="ANTHROPIC_API_KEY")
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    perplexity_api_key: Optional[str] = Field(default=None, env="PERPLEXITY_API_KEY")
    openrouter_api_key: Optional[str] = Field(default=None, env="OPENROUTER_API_KEY")
    ai_model_name: str = Field(default="claude-3-opus-20240229", env="AI_MODEL_NAME")
    embedding_model: str = Field(default="text-embedding-3-small", env="EMBEDDING_MODEL")
    ai_analysis_threshold: float = Field(default=0.8, env="AI_ANALYSIS_THRESHOLD")
    
    # Email Configuration
    email_polling_interval: int = Field(default=300, env="EMAIL_POLLING_INTERVAL")
    email_server_imap: str = Field(default="pop.securemail.pro", env="EMAIL_SERVER_IMAP")
    email_server_smtp: str = Field(default="authsmtp.securemail.pro", env="EMAIL_SERVER_SMTP")
    email_port_imap: int = Field(default=993, env="EMAIL_PORT_IMAP")
    email_port_smtp: int = Field(default=465, env="EMAIL_PORT_SMTP")
    system_email_address: str = Field(default="hello@thegridcompany.it", env="SYSTEM_EMAIL_ADDRESS")
    system_email_password: str = Field(..., env="SYSTEM_EMAIL_PASSWORD")
    
    # Redis Cache
    redis_url: Optional[str] = Field(default=None, env="REDIS_URL")
    
    # Rate Limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_period: int = Field(default=60, env="RATE_LIMIT_PERIOD")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Background Tasks
    celery_broker_url: str = Field(default="redis://localhost:6379/1", env="CELERY_BROKER_URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/2", env="CELERY_RESULT_BACKEND")
    
    # Business Logic
    response_time_alert_hours: int = Field(default=24, env="RESPONSE_TIME_ALERT_HOURS")
    client_silence_alert_days: int = Field(default=14, env="CLIENT_SILENCE_ALERT_DAYS")
    proposal_followup_days: int = Field(default=7, env="PROPOSAL_FOLLOWUP_DAYS")
    invoice_overdue_days: int = Field(default=30, env="INVOICE_OVERDUE_DAYS")
    
    # Memory System
    memory_short_term_days: int = Field(default=30, env="MEMORY_SHORT_TERM_DAYS")
    memory_decay_factor: float = Field(default=0.95, env="MEMORY_DECAY_FACTOR")
    
    # Company
    company_email_domain: str = Field(default="thegridcompany.it", env="COMPANY_EMAIL_DOMAIN")
    
    # Frontend
    frontend_url: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
        
    @validator("environment")
    def validate_environment(cls, v):
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"Environment must be one of: {allowed}")
        return v
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        return self.environment == "development"
    
    @property
    def database_url(self) -> str:
        """Construct database URL from Supabase settings."""
        # Extract project ID from Supabase URL
        project_id = self.supabase_url.split("//")[1].split(".")[0]
        return f"postgresql://postgres.{project_id}:@db.{project_id}.supabase.co:6543/postgres"


# Create global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings 