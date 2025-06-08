from fastapi import Request, Depends, HTTPException
from app.api.dependencies import get_current_active_user
from app.core.permissions import PermissionService, ResourceType, ActionType
from app.db.models import User

permission_service = PermissionService()

def require_permission(resource: ResourceType, action: ActionType):
    """Middleware to check if user has permission to perform action on resource"""
    async def permission_dependency(request: Request, user: User = Depends(get_current_active_user)):
        workspace_role = getattr(request.state, "workspace_role", None)
        
        if not workspace_role:
            raise HTTPException(status_code=403, detail="Workspace role not found")
        
        # The role from the state might be an Enum member, so get its value
        role_value = workspace_role.value if hasattr(workspace_role, 'value') else workspace_role

        is_owner = getattr(request.state, "is_resource_owner", False)

        if not permission_service.has_permission(role_value, resource, action, is_owner=is_owner):
            raise HTTPException(
                status_code=403, 
                detail=f"No permission to {action} {resource}"
            )
        
        return True
    
    return permission_dependency

def check_resource_ownership(resource_type: ResourceType, get_resource_owner_id):
    """Middleware to check if user is the owner of a resource"""
    async def ownership_dependency(request: Request, user: User = Depends(get_current_active_user)):
        owner_id = await get_resource_owner_id(request)
        
        is_owner = (owner_id is not None and owner_id == user.id)
        request.state.is_resource_owner = is_owner
        
        return is_owner
    
    return ownership_dependency 