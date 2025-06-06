"""
Authentication API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Body
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List, Callable
from uuid import UUID

from ..services.auth import AuthService
from ..core.logging import get_logger
from ..db.models import User, UserRole, TeamMember

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


class VerifyResponse(BaseModel):
    status: str
    access_token: Optional[str] = None
    team_member: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


auth_service = AuthService()


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


@router.post("/magic-login", response_model=LoginResponse)
async def magic_login(request: MagicLoginRequest):
    """Send magic link to user email."""
    result = await auth_service.send_magic_link(request.email)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/verify-magic-link", response_model=VerifyResponse)
async def verify_magic_link(request: VerifyTokenRequest):
    """Verify magic link token and return access token."""
    result = await auth_service.verify_magic_link(request.token)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


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
    """Authenticate user and return access token."""
    user = await auth_service.authenticate_user(email=form_data.email, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = auth_service._generate_access_token_for_user(user)
    user_info_for_response = UserResponse.from_orm(user).dict()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": user_info_for_response
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