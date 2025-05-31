"""
Authentication API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from ..services.auth import AuthService
from ..core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr


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


async def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """Get current authenticated user from token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    # Verify token
    user = await auth_service.verify_access_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Send magic link to user email."""
    result = await auth_service.send_magic_link(request.email)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/verify", response_model=VerifyResponse)
async def verify_magic_link(request: VerifyTokenRequest):
    """Verify magic link token and return access token."""
    result = await auth_service.verify_magic_link(request.token)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.get("/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information."""
    return {
        "user": current_user
    }


@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Logout user (client-side token removal)."""
    logger.info(f"User {current_user['email']} logged out")
    return {"status": "success", "message": "Logged out successfully"}


@router.post("/team-members", dependencies=[Depends(get_current_user)])
async def create_team_member(request: CreateTeamMemberRequest):
    """Create a new team member (admin only)."""
    # TODO: Add admin role check
    result = await auth_service.create_team_member(
        email=request.email,
        name=request.name,
        role=request.role,
        phone=request.phone
    )
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result 