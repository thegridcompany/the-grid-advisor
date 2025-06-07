# tests/core/test_config.py
import pytest
import os
from unittest.mock import patch

# Import after setting test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["TESTING"] = "true"

from app.core.config import Settings


def test_settings_initialization():
    """Test that Settings can be initialized with test values."""
    # Create settings with test environment variables
    with patch.dict(os.environ, {
        "SECRET_KEY": "test-secret",
        "ENCRYPTION_KEY": "test-encryption",
        "JWT_SECRET_KEY": "test-jwt",
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_ANON_KEY": "test-anon",
        "SUPABASE_SERVICE_KEY": "test-service",
        "ANTHROPIC_API_KEY": "test-anthropic",
        "OPENAI_API_KEY": "test-openai",
        "SYSTEM_EMAIL_PASSWORD": "test-password",
        "ENVIRONMENT": "test"
    }):
        settings = Settings()
        assert settings.environment == "test"
        assert settings.secret_key == "test-secret"
        assert settings.supabase_url == "https://test.supabase.co"


def test_settings_environment_properties():
    """Test environment-related properties."""
    # Test development environment
    with patch.dict(os.environ, {"ENVIRONMENT": "development"}):
        settings = Settings(
            secret_key="test",
            encryption_key="test",
            jwt_secret_key="test",
            supabase_url="test",
            supabase_anon_key="test",
            supabase_service_key="test",
            anthropic_api_key="test",
            openai_api_key="test",
            system_email_password="test"
        )
        assert settings.is_development is True
        assert settings.is_production is False
    
    # Test production environment
    with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
        settings = Settings(
            secret_key="test",
            encryption_key="test",
            jwt_secret_key="test",
            supabase_url="test",
            supabase_anon_key="test",
            supabase_service_key="test",
            anthropic_api_key="test",
            openai_api_key="test",
            system_email_password="test"
        )
        assert settings.is_development is False
        assert settings.is_production is True


def test_settings_database_url():
    """Test database URL construction from Supabase settings."""
    settings = Settings(
        secret_key="test",
        encryption_key="test",
        jwt_secret_key="test",
        supabase_url="https://myproject.supabase.co",
        supabase_anon_key="test",
        supabase_service_key="test",
        anthropic_api_key="test",
        openai_api_key="test",
        system_email_password="test"
    )
    
    expected_url = "postgresql://postgres.myproject:@db.myproject.supabase.co:6543/postgres"
    assert settings.database_url == expected_url


def test_settings_default_values():
    """Test that default values are set correctly."""
    settings = Settings(
        secret_key="test",
        encryption_key="test",
        jwt_secret_key="test",
        supabase_url="test",
        supabase_anon_key="test",
        supabase_service_key="test",
        anthropic_api_key="test",
        openai_api_key="test",
        system_email_password="test"
    )
    
    # Check some default values
    assert settings.app_name == "Grid Brain"
    assert settings.app_version == "1.0.0"
    assert settings.jwt_algorithm == "HS256"
    assert settings.jwt_expiration_hours == 24
    assert settings.host == "0.0.0.0"
    assert settings.port == 8000
    assert settings.log_level == "INFO"


def test_settings_environment_validation():
    """Test environment validation."""
    with pytest.raises(ValueError) as exc_info:
        Settings(
            secret_key="test",
            encryption_key="test",
            jwt_secret_key="test",
            supabase_url="test",
            supabase_anon_key="test",
            supabase_service_key="test",
            anthropic_api_key="test",
            openai_api_key="test",
            system_email_password="test",
            environment="invalid"
        )
    
    assert "Environment must be one of" in str(exc_info.value)

# Example of testing a specific setting value (if applicable)
# def test_specific_app_name():
#     assert settings.app_name == "Grid Brain" 