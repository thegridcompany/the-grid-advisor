"""
Project Management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional
from uuid import UUID

from ..core.database import get_db_manager, DatabaseManager
from ..core.logging import get_logger
from ..db.models import Project, Epic, Ticket, Sprint, Comment, TicketStatus, TicketPriority, ProjectMember
from .auth import get_current_active_user, User
from ..services.project_service import ProjectService
from ..core.workspace import get_workspace_context
from ..core.permission_middleware import require_permission

logger = get_logger(__name__)
router = APIRouter()
project_service = ProjectService()


# Project endpoints
@router.get("/", response_model=List[Project])
async def get_projects(
    request: Request,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    workspace_id: UUID = Depends(get_workspace_context),
    _permission: bool = Depends(require_permission("project", "read")),
) -> List[Project]:
    """Get all projects the current user has access to."""
    try:
        workspace_role = getattr(request.state, "workspace_role", None)
        if not workspace_role:
            # Fallback or raise error if role is not set
            # For now, let's assume a default role if not present, or handle appropriately
            # This part might need to be adjusted once the role-setting middleware is in place
            raise HTTPException(status_code=403, detail="Workspace role not found for user.")

        projects = await project_service.get_user_projects(
            user_id=current_user.id,
            workspace_id=workspace_id,
            role=workspace_role
        )
        
        # The service should handle sorting and pagination if needed, or we can do it here.
        # For now, returning the raw list from the service.
        return projects
    except Exception as e:
        logger.error("Failed to get projects", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve projects")


@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    workspace_id: UUID = Depends(get_workspace_context),
    db: DatabaseManager = Depends(get_db_manager),
    _permission: bool = Depends(require_permission("project", "read")),
) -> Project:
    """Get a specific project."""
    try:
        workspace_role = getattr(request.state, "workspace_role", None)
        if not workspace_role:
            raise HTTPException(status_code=403, detail="Workspace role not found for user.")

        can_access = await project_service.can_access_project(
            user_id=current_user.id,
            project_id=project_id,
            workspace_id=workspace_id,
            role=workspace_role
        )

        if not can_access:
            raise HTTPException(status_code=404, detail="Project not found or access denied")

        project = await db.get_by_id("project", str(project_id))
        if not project:
            # This case should technically be covered by can_access, but as a safeguard:
            raise HTTPException(status_code=404, detail="Project not found")
        return Project(**project)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get project", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve project")


@router.post("/", response_model=Project)
async def create_project(
    project: Project,
    db: DatabaseManager = Depends(get_db_manager),
    _permission: bool = Depends(require_permission("project", "create")),
) -> Project:
    """Create a new project."""
    try:
        project_data = project.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        created_project = await db.create("project", project_data)
        return Project(**created_project)
    except Exception as e:
        logger.error("Failed to create project", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create project")


@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: UUID,
    project: Project,
    db: DatabaseManager = Depends(get_db_manager),
    _permission: bool = Depends(require_permission("project", "update")),
) -> Project:
    """Update a project."""
    try:
        project_data = project.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        updated_project = await db.update("project", str(project_id), project_data)
        if not updated_project:
            raise HTTPException(status_code=404, detail="Project not found")
        return Project(**updated_project)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update project", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update project")


@router.delete("/{project_id}")
async def delete_project(
    project_id: UUID,
    db: DatabaseManager = Depends(get_db_manager),
    _permission: bool = Depends(require_permission("project", "delete")),
) -> dict:
    """Delete a project."""
    try:
        success = await db.delete("project", str(project_id))
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete project", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete project")


# Epic endpoints
@router.get("/{project_id}/epics", response_model=List[Epic])
async def get_project_epics(
    project_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> List[Epic]:
    """Get all epics for a project."""
    try:
        epics = await db.get_many("epic", filters={"project_id": str(project_id)}, order_by="-created_at")
        return [Epic(**epic) for epic in epics]
    except Exception as e:
        logger.error("Failed to get epics", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve epics")


@router.post("/{project_id}/epics", response_model=Epic)
async def create_epic(
    project_id: UUID,
    epic: Epic,
    db: DatabaseManager = Depends(get_db_manager)
) -> Epic:
    """Create a new epic."""
    try:
        epic_data = epic.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        epic_data["project_id"] = str(project_id)
        created_epic = await db.create("epic", epic_data)
        return Epic(**created_epic)
    except Exception as e:
        logger.error("Failed to create epic", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create epic")


# Ticket endpoints
@router.get("/{project_id}/tickets", response_model=List[Ticket])
async def get_project_tickets(
    project_id: UUID,
    status: Optional[TicketStatus] = None,
    assignee_id: Optional[UUID] = None,
    epic_id: Optional[UUID] = None,
    db: DatabaseManager = Depends(get_db_manager)
) -> List[Ticket]:
    """Get all tickets for a project with optional filters."""
    try:
        filters = {"project_id": str(project_id)}
        if status:
            filters["status"] = status.value
        if assignee_id:
            filters["assignee_id"] = str(assignee_id)
        if epic_id:
            filters["epic_id"] = str(epic_id)
        
        tickets = await db.get_many("ticket", filters=filters, order_by="-created_at")
        return [Ticket(**ticket) for ticket in tickets]
    except Exception as e:
        logger.error("Failed to get tickets", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve tickets")


@router.post("/{project_id}/tickets", response_model=Ticket)
async def create_ticket(
    project_id: UUID,
    ticket: Ticket,
    db: DatabaseManager = Depends(get_db_manager)
) -> Ticket:
    """Create a new ticket."""
    try:
        ticket_data = ticket.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        ticket_data["project_id"] = str(project_id)
        created_ticket = await db.create("ticket", ticket_data)
        return Ticket(**created_ticket)
    except Exception as e:
        logger.error("Failed to create ticket", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create ticket")


# Sprint endpoints
@router.get("/{project_id}/sprints", response_model=List[Sprint])
async def get_project_sprints(
    project_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> List[Sprint]:
    """Get all sprints for a project."""
    try:
        sprints = await db.get_many("sprint", filters={"project_id": str(project_id)}, order_by="-start_date")
        return [Sprint(**sprint) for sprint in sprints]
    except Exception as e:
        logger.error("Failed to get sprints", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve sprints")


@router.post("/{project_id}/sprints", response_model=Sprint)
async def create_sprint(
    project_id: UUID,
    sprint: Sprint,
    db: DatabaseManager = Depends(get_db_manager)
) -> Sprint:
    """Create a new sprint."""
    try:
        sprint_data = sprint.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        sprint_data["project_id"] = str(project_id)
        created_sprint = await db.create("sprint", sprint_data)
        return Sprint(**created_sprint)
    except Exception as e:
        logger.error("Failed to create sprint", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create sprint") 