from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from pydantic import BaseModel, EmailStr
from typing import List

from app.services.invitation_service import InvitationService
from app.api.dependencies import get_current_active_user
from app.core.workspace import get_workspace_context
from app.db.models import InvitationCreate, InvitationResponse, User, Workspace

router = APIRouter(prefix="/api/v1/invitations", tags=["invitations"])
invitation_service = InvitationService()

class ClientInvitationCreate(BaseModel):
    email: EmailStr
    project_ids: List[UUID]

@router.post("/client", response_model=InvitationResponse)
async def create_client_invitation(
    invitation_data: ClientInvitationCreate,
    workspace_id: UUID = Depends(get_workspace_context),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new client invitation and assign them to projects. (Admin only)
    """
    from app.services.workspace_service import WorkspaceService
    workspace_service = WorkspaceService()
    
    is_admin = await workspace_service.is_workspace_admin(workspace_id, current_user.id)
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only workspace admins can send invitations.")
    
    invitation = await invitation_service.create_client_invitation(
        email=invitation_data.email,
        workspace_id=workspace_id,
        project_ids=[str(pid) for pid in invitation_data.project_ids],
        invited_by=current_user.id
    )
    
    return InvitationResponse.from_orm(invitation)

@router.post("/", response_model=InvitationResponse)
async def create_invitation(
    invitation_data: InvitationCreate,
    workspace_id: UUID = Depends(get_workspace_context),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new invitation to join a workspace. (Admin only)
    """
    from app.services.workspace_service import WorkspaceService
    workspace_service = WorkspaceService()
    
    is_admin = await workspace_service.is_workspace_admin(workspace_id, current_user.id)
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only workspace admins can send invitations.")
    
    invitation = await invitation_service.create_invitation(
        email=invitation_data.email,
        workspace_id=workspace_id,
        role=invitation_data.role,
        invited_by=current_user.id
    )
    
    return InvitationResponse.from_orm(invitation)

@router.get("/verify/{token}")
async def verify_invitation(token: str):
    """
    Verify an invitation token to check its validity and get details.
    """
    try:
        invitation = await invitation_service.verify_invitation(token)
        workspace = await Workspace.get(id=invitation.workspace_id)
        return {
            "valid": True,
            "email": invitation.email,
            "workspace_name": workspace.name,
            "role": invitation.role,
            "expires_at": invitation.expires_at
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/accept/{token}")
async def accept_invitation(token: str, current_user: User = Depends(get_current_active_user)):
    """
    Accept an invitation and add the user to the workspace.
    """
    try:
        invitation = await invitation_service.verify_invitation(token)
        
        if invitation.email.lower() != current_user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation email does not match your account email."
            )
        
        accepted_invitation = await invitation_service.accept_invitation(token, current_user.id)
        
        # In a real implementation, you would generate a new token with the new workspace context
        from app.core.auth import create_access_token
        access_token = await create_access_token(current_user, workspace_id=accepted_invitation.workspace_id)
        
        return {
            "message": "Invitation accepted successfully!",
            "workspace_id": accepted_invitation.workspace_id,
            "access_token": access_token
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) 