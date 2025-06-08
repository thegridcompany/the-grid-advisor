from fastapi import Header, HTTPException, Depends
from typing import List, Callable

from ..services.auth import AuthService
from ..db.models import User, UserRole
from ..core.logging import get_logger

logger = get_logger(__name__)
auth_service = AuthService()

async def get_current_active_user(authorization: str = Header(None)) -> User:
    """Get current authenticated active user from token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    user = await auth_service.verify_user_access_token(token)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or expired token, or inactive user")
    
    return user

# RBAC Dependency
def require_role(allowed_roles: List[UserRole]) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            logger.warning(f"User {current_user.email} with role {current_user.role} tried to access restricted endpoint. Allowed roles: {allowed_roles}")
            raise HTTPException(
                status_code=403,
                detail=f"User does not have the required role. Allowed roles: {[role.value for role in allowed_roles]}"
            )
        return current_user
    return role_checker 