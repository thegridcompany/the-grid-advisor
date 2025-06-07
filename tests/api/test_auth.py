import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
import uuid

from app.main import app

# Create test client
client = TestClient(app)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    with patch('app.core.database.get_supabase') as mock:
        supabase_mock = MagicMock()
        
        # Mock auth methods
        supabase_mock.auth.sign_in_with_password = AsyncMock()
        supabase_mock.auth.sign_up = AsyncMock()
        supabase_mock.auth.sign_out = AsyncMock()
        
        # Mock table operations
        supabase_mock.table = MagicMock()
        
        mock.return_value = supabase_mock
        yield supabase_mock


@pytest.fixture
def mock_auth_service():
    """Mock AuthService for testing."""
    with patch('app.services.auth.AuthService') as mock:
        auth_service_mock = AsyncMock()
        
        # Mock methods
        auth_service_mock.register_user = AsyncMock()
        auth_service_mock.authenticate_user = AsyncMock()
        auth_service_mock.create_access_token = MagicMock()
        auth_service_mock.verify_token = AsyncMock()
        
        # Make the class return our mock instance
        mock.return_value = auth_service_mock
        yield auth_service_mock


def test_login_endpoint_success(mock_auth_service):
    """Test successful login."""
    # Mock user data
    user_data = {
        "id": str(uuid.uuid4()),
        "email": "test@example.com",
        "username": "testuser",
        "role": "MEMBER"
    }
    
    # Setup mock responses
    mock_auth_service.authenticate_user.return_value = user_data
    mock_auth_service.create_access_token.return_value = "test-jwt-token"
    
    # Make request
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"}
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_endpoint_invalid_credentials(mock_auth_service):
    """Test login with invalid credentials."""
    # Setup mock to return None for invalid credentials
    mock_auth_service.authenticate_user.return_value = None
    
    # Make request
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"}
    )
    
    # Assert response
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_register_endpoint_success(mock_auth_service):
    """Test successful user registration."""
    # Mock user data
    new_user = {
        "id": str(uuid.uuid4()),
        "email": "newuser@example.com",
        "username": "newuser",
        "role": "MEMBER"
    }
    
    # Setup mock response
    mock_auth_service.register_user.return_value = new_user
    
    # Make request
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "securepassword",
            "username": "newuser"
        }
    )
    
    # Assert response
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert "id" in data


def test_register_endpoint_duplicate_email(mock_auth_service):
    """Test registration with duplicate email."""
    # Setup mock to raise exception for duplicate email
    mock_auth_service.register_user.side_effect = ValueError("Email already exists")
    
    # Make request
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@example.com",
            "password": "password",
            "username": "newuser"
        }
    )
    
    # Assert response
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_me_endpoint_success(mock_auth_service):
    """Test getting current user info."""
    # Mock user data
    current_user = {
        "id": str(uuid.uuid4()),
        "email": "test@example.com",
        "username": "testuser",
        "role": "MEMBER"
    }
    
    # Setup mock response
    mock_auth_service.verify_token.return_value = current_user
    
    # Make request with auth header
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer test-jwt-token"}
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"


def test_me_endpoint_unauthorized():
    """Test getting current user without auth."""
    # Make request without auth header
    response = client.get("/api/v1/auth/me")
    
    # Assert response
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_logout_endpoint_success(mock_auth_service):
    """Test successful logout."""
    # Make request
    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": "Bearer test-jwt-token"}
    )
    
    # Assert response
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"