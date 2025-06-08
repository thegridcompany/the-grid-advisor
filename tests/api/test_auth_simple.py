"""
Simple test to verify test infrastructure is working.
"""
import pytest
import os
from httpx import AsyncClient

# Ensure we're using test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["LOG_LEVEL"] = "DEBUG"

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test that the API is running."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_login_endpoint_exists():
    """Test that login endpoint exists."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/token",
            json={"email": "test@example.com", "password": "test"}
        )
        # Should get 401 for invalid credentials, not 404
        assert response.status_code in [401, 422] 