"""
Authentication API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Body
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

from ..services.auth import AuthService
from ..core.logging import get_logger
from ..db.models import User, UserRole, TeamMember, Workspace
from ..core.auth import create_access_token
from ..services.workspace_service import WorkspaceService
from .dependencies import get_current_active_user, require_role

logger = get_logger(__name__)
router = APIRouter()


class MagicLoginRequest(BaseModel):
    email: EmailStr


class UserCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_info: Optional[Dict[str, Any]] = None
    workspace_info: Optional[Dict[str, Any]] = None


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    class Config:
        from_attributes = True


class VerifyTokenRequest(BaseModel):
    token: str


class CreateTeamMemberRequest(BaseModel):
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None


class LoginResponse(BaseModel):
    status: str
    message: str
    workspaces: Optional[List[Dict[str, Any]]] = None


class VerifyResponse(BaseModel):
    status: str
    access_token: Optional[str] = None
    user_info: Optional[Dict[str, Any]] = None
    workspace_info: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


auth_service = AuthService()
workspace_service = WorkspaceService()


@router.post("/magic-login", response_model=LoginResponse)
async def magic_login(request: MagicLoginRequest):
    """Send magic link to user email."""
    result = await auth_service.send_magic_link(request.email)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    # After finding user, get their workspaces
    user = await auth_service.get_user_by_email(request.email)
    workspaces = []
    if user:
        user_workspaces = await workspace_service.get_user_workspaces(user.id)
        workspaces = [{"id": ws.id, "name": ws.name, "slug": ws.slug} for ws in user_workspaces]

    return {**result, "workspaces": workspaces}


@router.post("/verify-magic-link", response_model=VerifyResponse)
async def verify_magic_link(request: VerifyTokenRequest):
    """Verify magic link token and return access token with workspace context."""
    result = await auth_service.verify_magic_link(request.token)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    user = await auth_service.get_user_by_id(UUID(result["team_member"]["id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found after verification")

    user_workspaces = await workspace_service.get_user_workspaces(user.id)
    default_workspace = user_workspaces[0] if user_workspaces else None
    
    access_token = await create_access_token(user, workspace_id=default_workspace.id if default_workspace else None)
    
    return {
        "status": "success",
        "access_token": access_token,
        "user_info": UserResponse.from_orm(user).dict(),
        "workspace_info": default_workspace.dict() if default_workspace else None
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info_ep(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Logout user (client-side token removal)."""
    logger.info(f"User {current_user.email} logged out")
    return {"status": "success", "message": "Logged out successfully"}


@router.post("/register", response_model=UserResponse, status_code=201)
async def register_new_user(user_data: UserCreateRequest):
    """Register a new application user."""
    result = await auth_service.register_user(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role,
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result.get("message", "Registration failed"))
    
    user_id = result.get("user_id")
    if not user_id:
        raise HTTPException(status_code=500, detail="User created but ID not returned")

    created_user = await auth_service.get_user_by_id(UUID(user_id))
    if not created_user:
        raise HTTPException(status_code=404, detail="User created but not found")
    return UserResponse.from_orm(created_user)


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: UserLoginRequest = Body(...)):
    """Authenticate user and return access token with workspace context."""
    user = await auth_service.authenticate_user(email=form_data.email, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    user_workspaces = await workspace_service.get_user_workspaces(user.id)
    default_workspace = user_workspaces[0] if user_workspaces else None

    access_token = await create_access_token(user, workspace_id=default_workspace.id if default_workspace else None)
    user_info_for_response = UserResponse.from_orm(user).dict()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": user_info_for_response,
        "workspace_info": default_workspace.dict() if default_workspace else None
    }


@router.post("/team-members", dependencies=[Depends(get_current_active_user), Depends(require_role([UserRole.TECH_LEAD, UserRole.CONSULTANT_PO]))])
async def create_team_member(request: CreateTeamMemberRequest):
    """Create a new team member (admin only)."""
    result = await auth_service.create_team_member(
        email=request.email,
        name=request.name,
        role=request.role,
        phone=request.phone
    )
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/switch-workspace/{workspace_id}", response_model=TokenResponse)
async def switch_workspace(
    workspace_id: UUID, 
    current_user: User = Depends(get_current_active_user)
):
    """Generate a new token for a different workspace."""
    user_workspaces = await workspace_service.get_user_workspaces(current_user.id)
    target_workspace = next((ws for ws in user_workspaces if ws.id == workspace_id), None)

    if not target_workspace:
        raise HTTPException(status_code=403, detail="User does not have access to this workspace.")

    access_token = await create_access_token(current_user, workspace_id=workspace_id)
    user_info_for_response = UserResponse.from_orm(current_user).dict()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": user_info_for_response,
        "workspace_info": target_workspace.dict()
    } 