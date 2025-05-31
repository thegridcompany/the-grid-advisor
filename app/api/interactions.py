"""
Interactions API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

from .auth import get_current_user
from ..core.database import get_db_manager
from ..core.logging import get_logger
from ..db.models import InteractionType

logger = get_logger(__name__)
router = APIRouter()


class InteractionResponse(BaseModel):
    id: UUID
    type: str
    subject: str
    client_id: Optional[UUID]
    team_member_id: UUID
    created_at: datetime
    importance_score: float
    sentiment: Optional[float]
    ai_summary: Optional[str]


@router.get("/", response_model=List[InteractionResponse])
async def get_interactions(
    current_user: Dict[str, Any] = Depends(get_current_user),
    interaction_type: Optional[str] = Query(None),
    client_id: Optional[UUID] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0)
):
    """Get interactions for current user."""
    db = get_db_manager()
    
    filters = {"team_member_id": current_user["id"]}
    if interaction_type:
        filters["type"] = interaction_type
    if client_id:
        filters["client_id"] = str(client_id)
    
    interactions = await db.get_many(
        "interactions",
        filters=filters,
        order_by="-created_at",
        limit=limit,
        offset=offset
    )
    
    return interactions


@router.get("/{interaction_id}")
async def get_interaction(
    interaction_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get specific interaction details."""
    db = get_db_manager()
    
    interaction = await db.get_by_id("interactions", str(interaction_id))
    
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    # Check if user has access
    if interaction["team_member_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return interaction


@router.get("/unresponded")
async def get_unresponded_interactions(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get interactions that require response."""
    db = get_db_manager()
    
    interactions = await db.get_many(
        "interactions",
        filters={
            "team_member_id": current_user["id"],
            "requires_response": True,
            "responded_at": None
        },
        order_by="response_deadline"
    )
    
    return interactions


@router.post("/{interaction_id}/respond")
async def mark_interaction_responded(
    interaction_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Mark interaction as responded."""
    db = get_db_manager()
    
    # Verify ownership
    interaction = await db.get_by_id("interactions", str(interaction_id))
    if not interaction or interaction["team_member_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    # Update interaction
    await db.update(
        "interactions",
        str(interaction_id),
        {"responded_at": datetime.utcnow().isoformat()}
    )
    
    return {"status": "success", "message": "Interaction marked as responded"} 