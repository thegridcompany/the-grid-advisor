"""
Blueprint Management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from ..core.database import get_db_manager, DatabaseManager
from ..core.logging import get_logger
from ..db.models import Blueprint, ProjectMember
from .auth import get_current_active_user, User

logger = get_logger(__name__)
router = APIRouter()


async def check_project_access(project_id: UUID, user: User, db: DatabaseManager, required_role: str = "member"):
    """Check if user has access to the project."""
    try:
        # Check if user is a member of the project
        membership = await db.get_many(
            "project_members",
            filters={"project_id": str(project_id), "user_id": str(user.id)}
        )
        
        if not membership:
            raise HTTPException(status_code=403, detail="Access denied to this project")
        
        # For now, we just check if user is a member. Could extend to role-based checks
        return True
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to check project access", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to verify project access")


# Blueprint endpoints
@router.get("/project/{project_id}", response_model=List[Blueprint])
async def get_project_blueprints(
    project_id: UUID,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: DatabaseManager = Depends(get_db_manager)
) -> List[Blueprint]:
    """Get all blueprints for a project."""
    await check_project_access(project_id, current_user, db)
    
    try:
        filters = {"project_id": str(project_id)}
        if status:
            filters["status"] = status
            
        blueprints = await db.get_many(
            "blueprints",
            filters=filters,
            limit=limit,
            offset=offset,
            order_by="-updated_at"
        )
        return [Blueprint(**blueprint) for blueprint in blueprints]
    except Exception as e:
        logger.error("Failed to get blueprints", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve blueprints")


@router.get("/{blueprint_id}", response_model=Blueprint)
async def get_blueprint(
    blueprint_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: DatabaseManager = Depends(get_db_manager)
) -> Blueprint:
    """Get a specific blueprint."""
    try:
        blueprint = await db.get_by_id("blueprints", str(blueprint_id))
        if not blueprint:
            raise HTTPException(status_code=404, detail="Blueprint not found")
        
        # Check project access
        await check_project_access(UUID(blueprint["project_id"]), current_user, db)
        
        return Blueprint(**blueprint)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get blueprint", blueprint_id=str(blueprint_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve blueprint")


@router.post("/", response_model=Blueprint)
async def create_blueprint(
    blueprint: Blueprint,
    current_user: User = Depends(get_current_active_user),
    db: DatabaseManager = Depends(get_db_manager)
) -> Blueprint:
    """Create a new blueprint."""
    # Check project access
    await check_project_access(blueprint.project_id, current_user, db)
    
    try:
        blueprint_data = blueprint.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        blueprint_data["author_id"] = str(current_user.id)
        
        created_blueprint = await db.create("blueprints", blueprint_data)
        return Blueprint(**created_blueprint)
    except Exception as e:
        logger.error("Failed to create blueprint", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create blueprint")


@router.put("/{blueprint_id}", response_model=Blueprint)
async def update_blueprint(
    blueprint_id: UUID,
    blueprint: Blueprint,
    current_user: User = Depends(get_current_active_user),
    db: DatabaseManager = Depends(get_db_manager)
) -> Blueprint:
    """Update a blueprint."""
    try:
        # Get existing blueprint
        existing = await db.get_by_id("blueprints", str(blueprint_id))
        if not existing:
            raise HTTPException(status_code=404, detail="Blueprint not found")
        
        # Check project access
        await check_project_access(UUID(existing["project_id"]), current_user, db)
        
        # Update data
        blueprint_data = blueprint.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at", "author_id"})
        
        updated_blueprint = await db.update("blueprints", str(blueprint_id), blueprint_data)
        if not updated_blueprint:
            raise HTTPException(status_code=404, detail="Blueprint not found")
        
        return Blueprint(**updated_blueprint)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update blueprint", blueprint_id=str(blueprint_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update blueprint")


@router.delete("/{blueprint_id}")
async def delete_blueprint(
    blueprint_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Delete a blueprint."""
    try:
        # Get existing blueprint
        existing = await db.get_by_id("blueprints", str(blueprint_id))
        if not existing:
            raise HTTPException(status_code=404, detail="Blueprint not found")
        
        # Check project access
        await check_project_access(UUID(existing["project_id"]), current_user, db)
        
        success = await db.delete("blueprints", str(blueprint_id))
        if not success:
            raise HTTPException(status_code=404, detail="Blueprint not found")
        
        return {"message": "Blueprint deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete blueprint", blueprint_id=str(blueprint_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete blueprint")


# Project membership endpoints
@router.get("/project/{project_id}/members", response_model=List[dict])
async def get_project_members(
    project_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: DatabaseManager = Depends(get_db_manager)
) -> List[dict]:
    """Get all members of a project."""
    await check_project_access(project_id, current_user, db)
    
    try:
        # Get project members with user info
        members = await db.get_many(
            "project_members",
            filters={"project_id": str(project_id)}
        )
        
        # Fetch user details for each member
        enriched_members = []
        for member in members:
            user = await db.get_by_id("profiles", member["user_id"])
            if user:
                enriched_members.append({
                    **member,
                    "user": user
                })
        
        return enriched_members
    except Exception as e:
        logger.error("Failed to get project members", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve project members")


@router.post("/project/{project_id}/members")
async def add_project_member(
    project_id: UUID,
    user_id: UUID,
    role: str = "member",
    current_user: User = Depends(get_current_active_user),
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Add a member to a project."""
    await check_project_access(project_id, current_user, db, required_role="admin")
    
    try:
        member_data = {
            "project_id": str(project_id),
            "user_id": str(user_id),
            "role": role
        }
        
        created_member = await db.create("project_members", member_data)
        return {"message": "Member added successfully", "member": created_member}
    except Exception as e:
        logger.error("Failed to add project member", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to add project member") 