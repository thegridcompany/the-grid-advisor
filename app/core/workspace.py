from uuid import UUID
from fastapi import Request, Depends, HTTPException, status

from app.services.workspace_service import WorkspaceService
# These will be created/connected later
# from app.core.auth import get_current_user
# from app.db.models import User
from app.db.models import WorkspaceMember, RoleEnum
from app.core.exceptions import PermissionError, NotFoundError

# Placeholder for auth dependency
def get_current_user():
    from app.db.models import User
    from uuid import uuid4
    # Return a dummy user for now
    return User(id=uuid4(), email="test@thegridcompany.it", username="testuser", hashed_password="", role="developer")


workspace_service = WorkspaceService()

async def get_workspace_context(request: Request, user: dict = Depends(get_current_user)) -> UUID:
    """
    FastAPI dependency to get and validate the workspace context from a request.
    It injects workspace_id and workspace_role into the request state.
    """
    workspace_id_str = request.headers.get("X-Workspace-ID") or request.query_params.get("workspace_id")
    
    workspace_id: UUID

    if not workspace_id_str:
        # If no workspace is specified, get the user's first available workspace.
        user_workspaces = await workspace_service.get_user_workspaces(user.id)
        if not user_workspaces:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have access to any workspace."
            )
        workspace_id = user_workspaces[0].id
    else:
        try:
            workspace_id = UUID(workspace_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid workspace ID format: {workspace_id_str}"
            )

    # Verify user has access to this workspace using the service layer.
    # In a real implementation, this would be a single efficient query.
    user_workspaces = await workspace_service.get_user_workspaces(user.id)
    if not any(ws.id == workspace_id for ws in user_workspaces):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User does not have access to workspace {workspace_id}"
        )

    # To get the role, we would ideally have a more direct method.
    # For now, we simulate it.
    is_admin = await workspace_service.is_workspace_admin(workspace_id, user.id)
    role = RoleEnum.ADMIN if is_admin else RoleEnum.MEMBER # Simplified for now

    # Set workspace context in request state for use in other dependencies/routes
    request.state.workspace_id = workspace_id
    request.state.workspace_role = role
    
    return workspace_id

# A helper to easily access the context
def get_current_workspace(request: Request) -> (UUID, RoleEnum):
    """
    Helper to get the current workspace_id and role from the request state.
    Should be used in routes after the get_workspace_context dependency.
    """
    workspace_id = getattr(request.state, 'workspace_id', None)
    workspace_role = getattr(request.state, 'workspace_role', None)
    if not workspace_id:
        raise RuntimeError("get_workspace_context dependency must be used to set workspace context.")
    return workspace_id, workspace_role 