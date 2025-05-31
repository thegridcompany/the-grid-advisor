"""
Health check API endpoints.
"""
from fastapi import APIRouter, Depends
from typing import Dict, Any
import pendulum

from ..core.database import get_supabase
from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": pendulum.now().isoformat(),
        "version": settings.app_version,
        "environment": settings.environment
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check including database connectivity."""
    db = get_supabase()
    
    # Check database
    db_healthy = await db.health_check()
    
    # Check AI services (basic check)
    ai_healthy = bool(settings.anthropic_api_key and settings.openai_api_key)
    
    # Overall status
    is_ready = db_healthy and ai_healthy
    
    return {
        "ready": is_ready,
        "checks": {
            "database": "healthy" if db_healthy else "unhealthy",
            "ai_services": "configured" if ai_healthy else "not_configured"
        },
        "timestamp": pendulum.now().isoformat()
    }


@router.get("/live")
async def liveness_check():
    """Liveness check for container orchestration."""
    return {
        "alive": True,
        "timestamp": pendulum.now().isoformat()
    } 