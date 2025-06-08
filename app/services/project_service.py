from uuid import UUID
from typing import List
from app.db.models import Project, ProjectMember
from app.core.permissions import WorkspaceRole

class ProjectService:
    async def get_user_projects(self, user_id: UUID, workspace_id: UUID, role: str) -> List[Project]:
        """Get projects accessible to user based on role"""
        if role in [WorkspaceRole.SUPER_ADMIN, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER]:
            return await Project.filter(workspace_id=workspace_id)
        
        if role in [WorkspaceRole.CLIENT, WorkspaceRole.VIEWER]:
            project_memberships = await ProjectMember.filter(user_id=user_id)
            project_ids = [pm.project_id for pm in project_memberships]
            
            return await Project.filter(
                workspace_id=workspace_id,
                id__in=project_ids
            )
        
        return []
    
    async def can_access_project(self, user_id: UUID, project_id: UUID, workspace_id: UUID, role: str) -> bool:
        """Check if user can access a specific project"""
        if role in [WorkspaceRole.SUPER_ADMIN, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER]:
            project = await Project.get_or_none(id=project_id, workspace_id=workspace_id)
            return project is not None
        
        if role in [WorkspaceRole.CLIENT, WorkspaceRole.VIEWER]:
            membership = await ProjectMember.get_or_none(
                user_id=user_id,
                project_id=project_id
            )
            return membership is not None
        
        return False 