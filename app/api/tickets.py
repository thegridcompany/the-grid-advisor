"""
Ticket and Comment Management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from ..core.database import get_db_manager, DatabaseManager
from ..core.logging import get_logger
from ..db.models import Ticket, Comment, TicketStatus, TicketPriority

logger = get_logger(__name__)
router = APIRouter()


# Ticket endpoints
@router.get("/{ticket_id}", response_model=Ticket)
async def get_ticket(
    ticket_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> Ticket:
    """Get a specific ticket."""
    try:
        ticket = await db.get_by_id("ticket", str(ticket_id))
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return Ticket(**ticket)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get ticket", ticket_id=str(ticket_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve ticket")


@router.put("/{ticket_id}", response_model=Ticket)
async def update_ticket(
    ticket_id: UUID,
    ticket: Ticket,
    db: DatabaseManager = Depends(get_db_manager)
) -> Ticket:
    """Update a ticket."""
    try:
        ticket_data = ticket.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        updated_ticket = await db.update("ticket", str(ticket_id), ticket_data)
        if not updated_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return Ticket(**updated_ticket)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update ticket", ticket_id=str(ticket_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update ticket")


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