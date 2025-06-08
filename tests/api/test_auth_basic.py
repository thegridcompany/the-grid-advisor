"""
Basic authentication tests without fixtures.
"""
import pytest
import os
from httpx import AsyncClient
from uuid import uuid4

# Ensure we're using test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["LOG_LEVEL"] = "DEBUG"

from app.main import app
from app.core.database import get_db_manager
from app.core.auth import get_password_hash
from app.db.models import UserRole


@pytest.mark.asyncio
async def test_login_with_nonexistent_user():
    """Test login failure with non-existent user."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/token",
            json={
                "email": "nonexistent@gmail.com",
                "password": "SomePassword123!"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_register_and_login():
    """Test user registration and login flow."""
    unique_email = f"test_{uuid4().hex[:8]}@gmail.com"
    unique_username = f"testuser_{uuid4().hex[:8]}"
    password = "TestPassword123!"
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register user
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": unique_username,
                "email": unique_email,
                "password": password,
                "role": UserRole.DEVELOPER.value,
                "first_name": "Test",
                "last_name": "User"
            }
        )
        
        assert register_response.status_code == 201
        user_data = register_response.json()
        user_id = user_data.get("id")
        
        # Login with the new user
        login_response = await client.post(
            "/api/v1/auth/token",
            json={
                "email": unique_email,
                "password": password
            }
        )
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "access_token" in login_data
        assert login_data["token_type"] == "bearer"
        
        # Cleanup: delete the test user
        if user_id:
            db_manager = get_db_manager()
            await db_manager.delete("users", user_id) 