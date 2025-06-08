"""
Test suite for authentication API endpoints.
Tests real authentication flow with Supabase.
"""
import pytest
import os
from httpx import AsyncClient
from datetime import datetime
from uuid import uuid4
import asyncio

# Ensure we're using test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["LOG_LEVEL"] = "DEBUG"

from app.main import app
from app.core.database import get_supabase, get_db_manager
from app.services.auth import AuthService
from app.db.models import UserRole
from app.core.auth import get_password_hash

# Test data
TEST_USER_EMAIL = f"test_{uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "TestPassword123!"
TEST_USERNAME = f"testuser_{uuid4().hex[:8]}"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client():
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_manager():
    """Get database manager instance."""
    return get_db_manager()


@pytest.fixture
async def auth_service():
    """Get auth service instance."""
    return AuthService()


@pytest.fixture
async def test_user(db_manager):
    """Create a test user in the database."""
    user_data = {
        "username": TEST_USERNAME,
        "email": TEST_USER_EMAIL,
        "hashed_password": get_password_hash(TEST_USER_PASSWORD),
        "role": UserRole.MEMBER.value,
        "is_active": True,
        "first_name": "Test",
        "last_name": "User"
    }
    
    # Create user in database
    created_user = await db_manager.create("users", user_data)
    
    yield created_user
    
    # Cleanup: delete the test user
    if created_user and "id" in created_user:
        await db_manager.delete("users", created_user["id"])


@pytest.fixture
async def test_workspace(db_manager, test_user):
    """Create a test workspace."""
    workspace_data = {
        "name": f"Test Workspace {uuid4().hex[:8]}",
        "slug": f"test-workspace-{uuid4().hex[:8]}",
        "description": "Test workspace for auth tests",
        "is_active": True,
        "owner_id": test_user["id"]
    }
    
    created_workspace = await db_manager.create("workspaces", workspace_data)
    
    # Add user to workspace
    workspace_member_data = {
        "workspace_id": created_workspace["id"],
        "user_id": test_user["id"],
        "role": "member",
        "is_active": True,
        "joined_at": datetime.utcnow().isoformat()
    }
    
    await db_manager.create("workspace_members", workspace_member_data)
    
    yield created_workspace
    
    # Cleanup
    if created_workspace and "id" in created_workspace:
        await db_manager.delete("workspaces", created_workspace["id"])


@pytest.mark.asyncio
async def test_login_with_valid_credentials(client, test_user, test_workspace):
    """Test successful login with valid credentials."""
    response = await client.post(
        "/api/v1/auth/token",
        json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user_info" in data
    assert data["user_info"]["email"] == TEST_USER_EMAIL
    assert data["user_info"]["username"] == TEST_USERNAME
    
    # Check workspace info
    assert "workspace_info" in data
    if data["workspace_info"]:
        assert data["workspace_info"]["id"] == str(test_workspace["id"])


@pytest.mark.asyncio
async def test_login_with_invalid_password(client, test_user):
    """Test login failure with wrong password."""
    response = await client.post(
        "/api/v1/auth/token",
        json={
            "email": TEST_USER_EMAIL,
            "password": "WrongPassword123!"
        }
    )
    
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_login_with_nonexistent_user(client):
    """Test login failure with non-existent user."""
    response = await client.post(
        "/api/v1/auth/token",
        json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
    )
    
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_login_with_inactive_user(client, db_manager, test_user):
    """Test login failure with inactive user."""
    # Deactivate the user
    await db_manager.update("users", test_user["id"], {"is_active": False})
    
    response = await client.post(
        "/api/v1/auth/token",
        json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
    )
    
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Inactive user"
    
    # Reactivate for cleanup
    await db_manager.update("users", test_user["id"], {"is_active": True})


@pytest.mark.asyncio
async def test_get_current_user_info(client, test_user, test_workspace):
    """Test getting current user info with valid token."""
    # First login to get token
    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
    )
    
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # Now test /me endpoint
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["email"] == TEST_USER_EMAIL
    assert data["username"] == TEST_USERNAME
    assert data["role"] == UserRole.MEMBER.value
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_get_current_user_without_token(client):
    """Test /me endpoint without authentication."""
    response = await client.get("/api/v1/auth/me")
    
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_get_current_user_with_invalid_token(client):
    """Test /me endpoint with invalid token."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"}
    )
    
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_switch_workspace(client, db_manager, test_user, test_workspace):
    """Test workspace switching functionality."""
    # Create a second workspace
    second_workspace_data = {
        "name": f"Second Workspace {uuid4().hex[:8]}",
        "slug": f"second-workspace-{uuid4().hex[:8]}",
        "is_active": True,
        "owner_id": test_user["id"]
    }
    
    second_workspace = await db_manager.create("workspaces", second_workspace_data)
    
    # Add user to second workspace
    await db_manager.create("workspace_members", {
        "workspace_id": second_workspace["id"],
        "user_id": test_user["id"],
        "role": "admin",
        "is_active": True,
        "joined_at": datetime.utcnow().isoformat()
    })
    
    try:
        # Login first
        login_response = await client.post(
            "/api/v1/auth/token",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        assert login_response.status_code == 200
        
        # Switch to second workspace
        switch_response = await client.post(
            f"/api/v1/auth/switch-workspace/{second_workspace['id']}",
            headers={"Authorization": f"Bearer {login_response.json()['access_token']}"}
        )
        
        assert switch_response.status_code == 200
        data = switch_response.json()
        
        assert "access_token" in data
        assert "workspace_info" in data
        assert data["workspace_info"]["id"] == str(second_workspace["id"])
        
    finally:
        # Cleanup second workspace
        if second_workspace and "id" in second_workspace:
            await db_manager.delete("workspaces", second_workspace["id"])


class TestMagicLinkAuthentication:
    """Test magic link authentication for team members."""
    
    @pytest.mark.asyncio
    async def test_magic_login_with_company_email(self, client, db_manager):
        """Test magic link request with company email."""
        # Create a team member
        team_member_data = {
            "email": "test@thegridcompany.it",
            "name": "Test Team Member",
            "role": "developer",
            "is_active": True
        }
        
        team_member = await db_manager.create("team_members", team_member_data)
        
        try:
            response = await client.post(
                "/api/v1/auth/magic-login",
                json={"email": "test@thegridcompany.it"}
            )
            
            # Should succeed but email won't actually send in test
            assert response.status_code == 200
            data = response.json()
            
            # The response depends on email configuration
            # In test environment without email config, it might fail
            assert data["status"] in ["success", "error"]
            
        finally:
            # Cleanup
            if team_member and "id" in team_member:
                await db_manager.delete("team_members", team_member["id"])
    
    @pytest.mark.asyncio
    async def test_magic_login_with_non_company_email(self, client):
        """Test magic link request with non-company email."""
        response = await client.post(
            "/api/v1/auth/magic-login",
            json={"email": "external@gmail.com"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "Access restricted" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_magic_login_with_nonexistent_team_member(self, client):
        """Test magic link request for non-existent team member."""
        response = await client.post(
            "/api/v1/auth/magic-login",
            json={"email": "nonexistent@thegridcompany.it"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "No team member found" in data["detail"]


class TestUserRegistration:
    """Test user registration functionality."""
    
    @pytest.mark.asyncio
    async def test_register_new_user(self, client, db_manager):
        """Test successful user registration."""
        unique_email = f"newuser_{uuid4().hex[:8]}@example.com"
        unique_username = f"newuser_{uuid4().hex[:8]}"
        
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": unique_username,
                "email": unique_email,
                "password": "SecurePassword123!",
                "role": UserRole.MEMBER.value,
                "first_name": "New",
                "last_name": "User"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["email"] == unique_email
        assert data["username"] == unique_username
        assert data["role"] == UserRole.MEMBER.value
        
        # Cleanup
        created_user_id = data.get("id")
        if created_user_id:
            await db_manager.delete("users", created_user_id)
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client, test_user):
        """Test registration failure with duplicate email."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "anotheruser",
                "email": TEST_USER_EMAIL,  # Already exists
                "password": "SecurePassword123!",
                "role": UserRole.MEMBER.value
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, client, test_user):
        """Test registration failure with duplicate username."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": TEST_USERNAME,  # Already exists
                "email": "another@example.com",
                "password": "SecurePassword123!",
                "role": UserRole.MEMBER.value
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"] 