# tests/test_main.py
"""Tests for the main FastAPI application."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


def test_app_exists():
    """Test that the FastAPI app exists."""
    assert app is not None


def test_root_endpoint(client):
    """Test the root endpoint returns expected data."""
    response = client.get("/")
    assert response.status_code == 200
    
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert "status" in data
    assert "environment" in data
    
    assert data["status"] == "operational"


def test_metrics_endpoint(client):
    """Test the metrics endpoint is available."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; charset=utf-8"
    
    # Check that prometheus metrics are returned
    content = response.text
    assert "http_requests_total" in content
    assert "http_request_duration_seconds" in content


def test_404_handler(client):
    """Test custom 404 handler."""
    response = client.get("/non-existent-endpoint")
    assert response.status_code == 404
    
    data = response.json()
    assert "error" in data
    assert data["error"] == "Not found"
    assert "path" in data
    assert data["path"] == "/non-existent-endpoint"


def test_cors_headers(client):
    """Test CORS headers are properly set."""
    # Test preflight request
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
    )
    
    # In development, we allow all origins
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-methods"] == "*"
    assert response.headers["access-control-allow-headers"] == "*"


def test_process_time_header(client):
    """Test that custom process time header is added."""
    response = client.get("/")
    assert "x-process-time" in response.headers
    assert "x-version" in response.headers
    
    # Process time should be a valid float
    process_time = float(response.headers["x-process-time"])
    assert process_time > 0