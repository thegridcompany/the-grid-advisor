"""
Email API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from uuid import UUID

from .auth import get_current_user
from ..email.service import EmailService
from ..core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

email_service = EmailService()


class EmailAccountSetupRequest(BaseModel):
    password: str


class SyncEmailsResponse(BaseModel):
    status: str
    emails_processed: int
    new_interactions: int
    message: Optional[str] = None


@router.post("/setup-account")
async def setup_email_account(
    request: EmailAccountSetupRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Set up email account for current user."""
    result = await email_service.setup_email_account(
        team_member_id=UUID(current_user["id"]),
        email_address=current_user["email"],
        password=request.password
    )
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/sync", response_model=SyncEmailsResponse)
async def sync_emails(
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Sync emails for current user."""
    # Run sync in background
    background_tasks.add_task(
        email_service.sync_team_member_emails,
        UUID(current_user["id"])
    )
    
    return {
        "status": "success",
        "emails_processed": 0,
        "new_interactions": 0,
        "message": "Email sync started in background"
    }


@router.post("/sync-all")
async def sync_all_emails(
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Sync emails for all team members (admin only)."""
    # TODO: Add admin role check
    
    # Run sync in background
    background_tasks.add_task(email_service.sync_all_team_emails)
    
    return {
        "status": "success",
        "message": "Email sync for all team members started in background"
    }


@router.get("/sync-status")
async def get_sync_status(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get email sync status for current user."""
    from ..core.database import get_db_manager
    
    db = get_db_manager()
    
    # Get email account status
    accounts = await db.get_many(
        "email_accounts",
        filters={"team_member_id": current_user["id"]}
    )
    
    if not accounts:
        return {
            "status": "not_configured",
            "message": "No email account configured"
        }
    
    account = accounts[0]
    
    return {
        "status": account["sync_status"],
        "last_sync": account.get("last_sync"),
        "error_message": account.get("error_message")
    } 