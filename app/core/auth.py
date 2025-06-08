from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.services.workspace_service import WorkspaceService
from app.db.models import WorkspaceMember, RoleEnum, User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

async def create_access_token(user: User, workspace_id: Optional[UUID] = None) -> str:
    """
    Creates a new JWT access token with workspace context.
    """
    workspace_service = WorkspaceService()
    
    # If no workspace_id provided, try to get the user's default/first workspace
    if not workspace_id:
        workspaces = await workspace_service.get_user_workspaces(user.id)
        if workspaces:
            workspace_id = workspaces[0].id

    # Get user's role in the selected workspace
    workspace_role: Optional[RoleEnum] = None
    if workspace_id:
        # This is a placeholder. A real implementation would query the database.
        # member = await WorkspaceMember.get_or_none(...)
        is_admin = await workspace_service.is_workspace_admin(workspace_id, user.id)
        workspace_role = RoleEnum.ADMIN if is_admin else RoleEnum.MEMBER
        
    to_encode = {
        "sub": str(user.id),
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow(),
        "email": user.email,
        "role": user.role.value,
        "workspace_id": str(workspace_id) if workspace_id else None,
        "workspace_role": workspace_role.value if workspace_role else None,
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt 