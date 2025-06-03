# tests/core/test_config.py
import pytest

from app.core.config import settings, Settings

def test_settings_default_environment():
    """Test that the default environment is development."""
    # Assuming the default environment in Settings class is 'development'
    # or that .env file is not setting it to production for tests.
    assert settings.environment == "development"
    assert settings.is_development is True
    assert settings.is_production is False


def test_settings_production_environment(monkeypatch):
    """Test that is_production and is_development reflect overridden environment."""
    # Temporarily set the environment to production for this test
    monkeypatch.setattr(settings, "environment", "production")
    
    # Re-evaluate properties based on the new environment
    # Note: Pydantic settings are often immutable or cached after first access.
    # For a robust test of environment variable overriding, you might need to reload settings 
    # or instantiate Settings directly with overridden env vars.
    # This test checks if manually changing the attribute works as expected for the properties.

    # Create a new Settings instance with the monkeypatched environment if direct setattr doesn't re-evaluate
    # This depends on how Settings is structured. For this example, let's assume direct setattr is sufficient
    # or that the properties re-evaluate. A more robust way for pydantic-settings is to mock os.environ
    # before settings are imported/instantiated if they load at import time.
    
    # Since settings is a global instance, monkeypatching its attribute is the most direct way here
    # if its properties are defined to re-evaluate.
    
    assert settings.environment == "production"
    assert settings.is_development is False
    assert settings.is_production is True

    # Clean up the monkeypatch (pytest does this automatically after the test)

# Example of testing a specific setting value (if applicable)
# def test_specific_app_name():
#     assert settings.app_name == "Grid Brain" 