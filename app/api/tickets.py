"""
Ticket and Comment Management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import List, Optional
from uuid import UUID
from tortoise.expressions import Q

from ..core.database import get_db_manager, DatabaseManager
from ..core.logging import get_logger
from ..db.models import Ticket, Comment, TicketStatus, TicketPriority, User
from app.api.dependencies import get_current_active_user
from app.core.workspace import get_workspace_context
from app.core.permissions import ResourceType, ActionType
from app.core.permission_middleware import require_permission, check_resource_ownership
from app.services.project_service import ProjectService

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])

async def get_ticket_owner_id(request: Request):
    ticket_id = request.path_params.get("ticket_id")
    if not ticket_id:
        return None
    
    ticket = await Ticket.get_or_none(id=ticket_id)
    if not ticket:
        return None
    
    return ticket.reporter_id

# Ticket endpoints
@router.get("/", response_model=List[Ticket])
async def list_tickets(
    request: Request,
    project_id: Optional[UUID] = None,
    user: User = Depends(get_current_active_user),
    workspace_id: UUID = Depends(get_workspace_context),
    _permission = Depends(require_permission(ResourceType.TICKET, ActionType.READ))
):
    query = Ticket.all()
    
    if project_id:
        project_service = ProjectService()
        workspace_role = getattr(request.state, "workspace_role", None)
        role_value = workspace_role.value if hasattr(workspace_role, 'value') else workspace_role
        can_access = await project_service.can_access_project(
            user_id=user.id,
            project_id=project_id,
            workspace_id=workspace_id,
            role=role_value
        )
        if not can_access:
            raise HTTPException(status_code=404, detail="Project not found")
        query = query.filter(project_id=project_id)
    
    workspace_role = getattr(request.state, "workspace_role", None)
    role_value = workspace_role.value if hasattr(workspace_role, 'value') else workspace_role
    if role_value == "CLIENT":
        query = query.filter(Q(reporter_id=user.id) | Q(assignee_id=user.id))
    
    tickets = await query
    return tickets


@router.post("/", response_model=Ticket)
async def create_ticket(
    request: Request,
    ticket_data: Ticket,
    user: User = Depends(get_current_active_user),
    workspace_id: UUID = Depends(get_workspace_context),
    _permission = Depends(require_permission(ResourceType.TICKET, ActionType.CREATE))
):
    project_service = ProjectService()
    workspace_role = getattr(request.state, "workspace_role", None)
    role_value = workspace_role.value if hasattr(workspace_role, 'value') else workspace_role
    can_access = await project_service.can_access_project(
        user_id=user.id,
        project_id=ticket_data.project_id,
        workspace_id=workspace_id,
        role=role_value
    )
    if not can_access:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_ticket = await Ticket.create(
        **ticket_data.dict(exclude_unset=True),
        reporter_id=user.id
    )
    return new_ticket


@router.get("/{ticket_id}", response_model=Ticket)
async def get_ticket(
    request: Request,
    ticket_id: UUID,
    user: User = Depends(get_current_active_user),
    _permission = Depends(require_permission(ResourceType.TICKET, ActionType.READ))
):
    ticket = await Ticket.get_or_none(id=ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    workspace_role = getattr(request.state, "workspace_role", None)
    role_value = workspace_role.value if hasattr(workspace_role, 'value') else workspace_role
    if role_value == "CLIENT" and ticket.reporter_id != user.id and ticket.assignee_id != user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket


@router.put("/{ticket_id}", response_model=Ticket)
async def update_ticket(
    request: Request,
    ticket_id: UUID,
    ticket_update: Ticket,
    user: User = Depends(get_current_active_user),
    is_owner: bool = Depends(check_resource_ownership(ResourceType.TICKET, get_ticket_owner_id)),
    _permission = Depends(require_permission(ResourceType.TICKET, ActionType.UPDATE))
):
    ticket = await Ticket.get_or_none(id=ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    workspace_role = getattr(request.state, "workspace_role", None)
    role_value = workspace_role.value if hasattr(workspace_role, 'value') else workspace_role
    if role_value == "CLIENT" and not is_owner:
        raise HTTPException(status_code=403, detail="Cannot update tickets you didn't create")
    
    update_data = ticket_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ticket, key, value)
    
    await ticket.save()
    return ticket


@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Delete a ticket."""
    try:
        success = await db.delete("ticket", str(ticket_id))
        if not success:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return {"message": "Ticket deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete ticket", ticket_id=str(ticket_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete ticket")


@router.patch("/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: UUID,
    status: TicketStatus,
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Update ticket status."""
    try:
        updated_ticket = await db.update("ticket", str(ticket_id), {"status": status.value})
        if not updated_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return {"message": f"Ticket status updated to {status.value}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update ticket status", ticket_id=str(ticket_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update ticket status")


@router.patch("/{ticket_id}/assign")
async def assign_ticket(
    ticket_id: UUID,
    assignee_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Assign ticket to a user."""
    try:
        updated_ticket = await db.update("ticket", str(ticket_id), {"assignee_id": str(assignee_id)})
        if not updated_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return {"message": "Ticket assigned successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to assign ticket", ticket_id=str(ticket_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to assign ticket")


# Comment endpoints
@router.get("/{ticket_id}/comments", response_model=List[Comment])
async def get_ticket_comments(
    ticket_id: UUID,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: DatabaseManager = Depends(get_db_manager)
) -> List[Comment]:
    """Get all comments for a ticket."""
    try:
        comments = await db.get_many(
            "comment", 
            filters={"ticket_id": str(ticket_id)}, 
            order_by="-created_at",
            limit=limit,
            offset=offset
        )
        return [Comment(**comment) for comment in comments]
    except Exception as e:
        logger.error("Failed to get comments", ticket_id=str(ticket_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve comments")


@router.post("/{ticket_id}/comments", response_model=Comment)
async def create_comment(
    ticket_id: UUID,
    comment: Comment,
    db: DatabaseManager = Depends(get_db_manager)
) -> Comment:
    """Create a new comment on a ticket."""
    try:
        comment_data = comment.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        comment_data["ticket_id"] = str(ticket_id)
        created_comment = await db.create("comment", comment_data)
        return Comment(**created_comment)
    except Exception as e:
        logger.error("Failed to create comment", ticket_id=str(ticket_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create comment")


@router.get("/comments/{comment_id}", response_model=Comment)
async def get_comment(
    comment_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> Comment:
    """Get a specific comment."""
    try:
        comment = await db.get_by_id("comment", str(comment_id))
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        return Comment(**comment)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get comment", comment_id=str(comment_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve comment")


@router.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: UUID,
    comment: Comment,
    db: DatabaseManager = Depends(get_db_manager)
) -> Comment:
    """Update a comment."""
    try:
        comment_data = comment.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at", "ticket_id", "user_id"})
        updated_comment = await db.update("comment", str(comment_id), comment_data)
        if not updated_comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        return Comment(**updated_comment)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update comment", comment_id=str(comment_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update comment")


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Delete a comment."""
    try:
        success = await db.delete("comment", str(comment_id))
        if not success:
            raise HTTPException(status_code=404, detail="Comment not found")
        return {"message": "Comment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete comment", comment_id=str(comment_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete comment") 