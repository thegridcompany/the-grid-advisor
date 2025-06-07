# tests/conftest.py
"""
Pytest configuration and shared fixtures for the test suite.
"""
import os
import pytest
import asyncio
from typing import Generator
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

# Set test environment before importing app
os.environ["ENVIRONMENT"] = "test"
os.environ["TESTING"] = "true"

from app.main import app
from app.core.database import SupabaseClient, DatabaseManager


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
def client() -> Generator:
    """Create a test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_supabase_client(mocker) -> SupabaseClient:
    """Mock the Supabase client."""
    mock = mocker.Mock(spec=SupabaseClient)
    
    # Mock the client properties
    mock.client = MagicMock()
    mock.service_client = MagicMock()
    
    # Mock methods
    mock.health_check = AsyncMock(return_value=True)
    mock.get_table = MagicMock()
    mock.execute_rpc = AsyncMock()
    mock.realtime_subscribe = MagicMock()
    
    return mock


@pytest.fixture
def mock_db_manager(mocker) -> DatabaseManager:
    """Mock the DatabaseManager."""
    mock = mocker.Mock(spec=DatabaseManager)
    
    # Convert all methods to AsyncMock
    mock.get_by_id = AsyncMock()
    mock.get_many = AsyncMock()
    mock.create = AsyncMock()
    mock.update = AsyncMock()
    mock.delete = AsyncMock()
    mock.upsert = AsyncMock()
    
    return mock


@pytest.fixture
def mock_auth_service(mocker):
    """Mock the AuthService."""
    from app.services.auth import AuthService
    
    mock = mocker.Mock(spec=AuthService)
    
    # Mock methods
    mock.send_magic_link = AsyncMock()
    mock.verify_magic_link = AsyncMock()
    mock.register_user = AsyncMock()
    mock.authenticate_user = AsyncMock()
    mock.create_team_member = AsyncMock()
    mock.verify_user_access_token = AsyncMock()
    mock.get_user_by_id = AsyncMock()
    mock._generate_access_token_for_user = MagicMock()
    
    return mock


@pytest.fixture(autouse=True)
def reset_dependencies():
    """Reset FastAPI dependency overrides before each test."""
    app.dependency_overrides = {}
    yield
    app.dependency_overrides = {}


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "test@example.com",
        "username": "testuser",
        "role": "MEMBER",
        "is_active": True,
        "first_name": "Test",
        "last_name": "User"
    }


@pytest.fixture
def auth_headers(sample_user_data):
    """Generate auth headers for testing."""
    return {"Authorization": "Bearer test-jwt-token"}


# Disable external API calls during tests
@pytest.fixture(autouse=True)
def disable_external_calls(mocker):
    """Disable external API calls during tests."""
    # Mock Supabase client creation
    mocker.patch('supabase.create_client')
    
    # Mock AI service calls
    mocker.patch('anthropic.Client')
    mocker.patch('openai.Client')
    
    # Mock email services
    mocker.patch('imap_tools.MailBox')
    mocker.patch('smtplib.SMTP_SSL')
    
    # Mock Redis
    mocker.patch('redis.Redis')
    
    yield 