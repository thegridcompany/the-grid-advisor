from fastapi import APIRouter, Depends, HTTPException, status, Request
from uuid import UUID
from typing import List, Optional

from app.db.models import Workspace, WorkspaceMember, RoleEnum, User
from app.services.workspace_service import WorkspaceService
from app.services.workspace_migration import WorkspaceMigrationService
from app.core.workspace import get_workspace_context, get_current_user
from app.core.exceptions import NotFoundError, PermissionError
from pydantic import BaseModel, Field


# --- Pydantic models for request bodies ---
class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    domain: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    domain: Optional[str] = None
    settings: Optional[dict] = None

class MemberAdd(BaseModel):
    user_id: UUID
    role: RoleEnum = RoleEnum.MEMBER

class MemberUpdate(BaseModel):
    role: RoleEnum

class ResourceMigration(BaseModel):
    resource_type: str
    resource_id: UUID


# --- API Router ---
router = APIRouter()
workspace_service = WorkspaceService()
migration_service = WorkspaceMigrationService()

@router.get("", response_model=List[Workspace])
async def list_user_workspaces(
    current_user: User = Depends(get_current_user)
):
    """List all workspaces the current user is a member of."""
    return await workspace_service.get_user_workspaces(user_id=current_user.id)

@router.post("", response_model=Workspace, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new workspace."""
    workspace = await workspace_service.create_workspace(
        data=workspace_data.dict(), 
        owner_id=current_user.id
    )
    return workspace

@router.get("/{workspace_id}", response_model=Workspace)
async def get_workspace(
    workspace_id: UUID = Depends(get_workspace_context)
):
    """Get details of a specific workspace."""
    try:
        return await workspace_service.get_workspace(workspace_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/{workspace_id}", response_model=Workspace)
async def update_workspace(
    workspace_data: WorkspaceUpdate,
    workspace_id: UUID = Depends(get_workspace_context),
    current_user: User = Depends(get_current_user),
):
    """Update a workspace's details."""
    try:
        updated_workspace = await workspace_service.update_workspace(
            workspace_id=workspace_id,
            data=workspace_data.dict(exclude_unset=True),
            user_id=current_user.id
        )
        return updated_workspace
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: UUID = Depends(get_workspace_context),
    current_user: User = Depends(get_current_user)
):
    """Deactivate a workspace."""
    try:
        await workspace_service.delete_workspace(workspace_id, user_id=current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return None

# --- Member Management ---

@router.get("/{workspace_id}/members", response_model=List[WorkspaceMember])
async def list_workspace_members(
    workspace_id: UUID = Depends(get_workspace_context),
    current_user: User = Depends(get_current_user)
):
    """List all members of a specific workspace."""
    return await workspace_service.get_workspace_members(workspace_id, current_user_id=current_user.id)

@router.post("/{workspace_id}/members", response_model=WorkspaceMember, status_code=status.HTTP_201_CREATED)
async def add_workspace_member(
    member_data: MemberAdd,
    workspace_id: UUID = Depends(get_workspace_context),
    current_user: User = Depends(get_current_user)
):
    """Add a new member to a workspace."""
    try:
        return await workspace_service.add_workspace_member(
            workspace_id=workspace_id,
            user_id=member_data.user_id,
            role=member_data.role,
            invited_by=current_user.id
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.put("/{workspace_id}/members/{user_id}", response_model=WorkspaceMember)
async def update_member_role(
    user_id: UUID,
    member_data: MemberUpdate,
    workspace_id: UUID = Depends(get_workspace_context),
    current_user: User = Depends(get_current_user)
):
    """Update a member's role in a workspace."""
    try:
        return await workspace_service.update_member_role(
            workspace_id=workspace_id,
            user_id=user_id,
            role=member_data.role,
            current_user_id=current_user.id
        )
    except (PermissionError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_workspace_member(
    user_id: UUID,
    workspace_id: UUID = Depends(get_workspace_context),
    current_user: User = Depends(get_current_user)
):
    """Remove a member from a workspace."""
    try:
        await workspace_service.remove_workspace_member(
            workspace_id=workspace_id,
            user_id=user_id,
            current_user_id=current_user.id
        )
    except (PermissionError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return None

# --- Data Migration ---

@router.post("/{source_workspace_id}/copy-to/{target_workspace_id}", status_code=status.HTTP_200_OK)
async def copy_resource(
    source_workspace_id: UUID,
    target_workspace_id: UUID,
    migration_data: ResourceMigration,
    current_user: User = Depends(get_current_user)
):
    """Copy a resource from one workspace to another."""
    try:
        result = await migration_service.copy_resource(
            resource_type=migration_data.resource_type,
            resource_id=migration_data.resource_id,
            source_workspace_id=source_workspace_id,
            target_workspace_id=target_workspace_id,
            current_user_id=current_user.id
        )
        return result
    except (PermissionError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/{source_workspace_id}/move-to/{target_workspace_id}", status_code=status.HTTP_200_OK)
async def move_resource(
    source_workspace_id: UUID,
    target_workspace_id: UUID,
    migration_data: ResourceMigration,
    current_user: User = Depends(get_current_user)
):
    """Move a resource from one workspace to another."""
    try:
        result = await migration_service.move_resource(
            resource_type=migration_data.resource_type,
            resource_id=migration_data.resource_id,
            source_workspace_id=source_workspace_id,
            target_workspace_id=target_workspace_id,
            current_user_id=current_user.id
        )
        return result
    except (PermissionError, NotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) 