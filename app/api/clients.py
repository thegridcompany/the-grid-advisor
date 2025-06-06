"""
Clients API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

from .auth import get_current_active_user
from ..db.models import User
from ..core.database import get_db_manager
from ..core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


class ClientResponse(BaseModel):
    id: UUID
    name: str
    email: Optional[EmailStr]
    company: Optional[str]
    status: str
    engagement_score: float
    last_interaction: Optional[datetime]


class CreateClientRequest(BaseModel):
    name: str
    email: Optional[EmailStr]
    company: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    industry: Optional[str]
    notes: Optional[str]


@router.get("/", response_model=List[ClientResponse])
async def get_clients(
    current_user: User = Depends(get_current_active_user),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0)
):
    """Get all clients."""
    db = get_db_manager()
    
    filters = {}
    if status:
        filters["status"] = status
    
    # TODO: Implement search functionality
    
    clients = await db.get_many(
        "clients",
        filters=filters,
        order_by="-last_interaction",
        limit=limit,
        offset=offset
    )
    
    return clients


@router.get("/{client_id}")
async def get_client(
    client_id: UUID,
    current_user: User = Depends(get_current_active_user)
):
    """Get specific client details."""
    db = get_db_manager()
    
    client = await db.get_by_id("clients", str(client_id))
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return client


@router.post("/", response_model=ClientResponse)
async def create_client(
    request: CreateClientRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new client."""
    db = get_db_manager()
    
    # Check if client with same email exists
    if request.email:
        existing = await db.get_many(
            "clients",
            filters={"email": request.email}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Client with this email already exists")
    
    client_data = request.dict()
    client_data["status"] = "active"
    client_data["engagement_score"] = 50.0  # Default score
    
    client = await db.create("clients", client_data)
    
    logger.info(f"Created client: {client['name']}", client_id=client["id"])
    
    return client


@router.put("/{client_id}")
async def update_client(
    client_id: UUID,
    request: CreateClientRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update client information."""
    db = get_db_manager()
    
    # Verify client exists
    existing = await db.get_by_id("clients", str(client_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    
    updated = await db.update("clients", str(client_id), request.dict())
    
    return updated


@router.get("/{client_id}/health")
async def get_client_health(
    client_id: UUID,
    current_user: User = Depends(get_current_active_user)
):
    """Get client health metrics."""
    db = get_db_manager()
    
    # Get latest health snapshot
    snapshots = await db.get_many(
        "client_health",
        filters={"client_id": str(client_id)},
        order_by="-snapshot_date",
        limit=1
    )
    
    if not snapshots:
        return {
            "client_id": client_id,
            "status": "no_data",
            "message": "No health data available for this client"
        }
    
    return snapshots[0]


@router.get("/{client_id}/interactions")
async def get_client_interactions(
    client_id: UUID,
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(20, le=100)
):
    """Get recent interactions with client."""
    db = get_db_manager()
    
    interactions = await db.get_many(
        "interactions",
        filters={"client_id": str(client_id)},
        order_by="-created_at",
        limit=limit
    )
    
    return interactions 