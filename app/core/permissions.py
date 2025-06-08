from enum import Enum
from typing import Dict, List, Set, Optional

class WorkspaceRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    CLIENT = "CLIENT"
    VIEWER = "VIEWER"

class ResourceType(str, Enum):
    WORKSPACE = "workspace"
    PROJECT = "project"
    TICKET = "ticket"
    USER = "user"
    COMMENT = "comment"
    ATTACHMENT = "attachment"
    REPORT = "report"

class ActionType(str, Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    MANAGE = "manage"

PERMISSION_MATRIX: Dict[str, Dict[ResourceType, List[ActionType]]] = {
    "SUPER_ADMIN": {
        ResourceType.WORKSPACE: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MANAGE],
        ResourceType.PROJECT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MANAGE],
        ResourceType.TICKET: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MANAGE],
        ResourceType.USER: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MANAGE],
        ResourceType.COMMENT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
        ResourceType.ATTACHMENT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
        ResourceType.REPORT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
    },
    "ADMIN": {
        ResourceType.WORKSPACE: [ActionType.READ, ActionType.UPDATE],
        ResourceType.PROJECT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MANAGE],
        ResourceType.TICKET: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MANAGE],
        ResourceType.USER: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
        ResourceType.COMMENT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
        ResourceType.ATTACHMENT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
        ResourceType.REPORT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
    },
    "MEMBER": {
        ResourceType.WORKSPACE: [ActionType.READ],
        ResourceType.PROJECT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
        ResourceType.TICKET: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
        ResourceType.USER: [ActionType.READ],
        ResourceType.COMMENT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
        ResourceType.ATTACHMENT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
        ResourceType.REPORT: [ActionType.READ],
    },
    "CLIENT": {
        ResourceType.WORKSPACE: [ActionType.READ],
        ResourceType.PROJECT: [ActionType.READ],
        ResourceType.TICKET: [ActionType.CREATE, ActionType.READ],
        ResourceType.USER: [ActionType.READ],
        ResourceType.COMMENT: [ActionType.CREATE, ActionType.READ],
        ResourceType.ATTACHMENT: [ActionType.CREATE, ActionType.READ],
        ResourceType.REPORT: [ActionType.READ],
    },
    "VIEWER": {
        ResourceType.WORKSPACE: [ActionType.READ],
        ResourceType.PROJECT: [ActionType.READ],
        ResourceType.TICKET: [ActionType.READ],
        ResourceType.USER: [ActionType.READ],
        ResourceType.COMMENT: [ActionType.READ],
        ResourceType.ATTACHMENT: [ActionType.READ],
        ResourceType.REPORT: [ActionType.READ],
    },
}

class PermissionService:
    @staticmethod
    def has_permission(role: str, resource: ResourceType, action: ActionType, is_owner: bool = False) -> bool:
        if role == "SUPER_ADMIN":
            return True
        
        role_permissions = PERMISSION_MATRIX.get(role, {})
        allowed_actions = role_permissions.get(resource, [])
        
        if action in allowed_actions or ActionType.MANAGE in allowed_actions:
            return True
        
        if is_owner and action in [ActionType.UPDATE, ActionType.DELETE]:
            if resource in [ResourceType.TICKET, ResourceType.COMMENT, ResourceType.ATTACHMENT]:
                return True
        
        return False
    
    @staticmethod
    def get_role_permissions(role: str) -> Dict[ResourceType, List[ActionType]]:
        return PERMISSION_MATRIX.get(role, {}) 