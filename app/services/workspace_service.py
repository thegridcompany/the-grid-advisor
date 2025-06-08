from uuid import UUID
from typing import List
from app.db.models import Workspace, WorkspaceMember, RoleEnum
from app.core.exceptions import NotFoundError, PermissionError


class WorkspaceService:
    async def get_workspace(self, workspace_id: UUID) -> Workspace:
        # This will be replaced with actual database logic
        print(f"Getting workspace {workspace_id}")
        # Simulating a not found case
        if str(workspace_id) == "00000000-0000-0000-0000-000000000000":
             raise NotFoundError(f"Workspace {workspace_id} not found")
        return Workspace(id=workspace_id, name="Test Workspace", slug="test-workspace", owner_id=UUID())

    async def get_user_workspaces(self, user_id: UUID) -> List[Workspace]:
        print(f"Getting workspaces for user {user_id}")
        return [Workspace(id=UUID(), name="Test Workspace", slug="test-workspace", owner_id=user_id)]

    async def create_workspace(self, data: dict, owner_id: UUID) -> Workspace:
        print(f"Creating workspace with data: {data} for owner {owner_id}")
        # In a real scenario, you'd create the Workspace and WorkspaceMember records
        new_workspace = Workspace(id=UUID(), owner_id=owner_id, **data)
        return new_workspace

    async def update_workspace(self, workspace_id: UUID, data: dict, user_id: UUID) -> Workspace:
        if not await self.is_workspace_admin(workspace_id, user_id):
            raise PermissionError("Only workspace admins can update workspace")
        print(f"Updating workspace {workspace_id} with data {data} by user {user_id}")
        # In a real scenario, you'd fetch, update, and save.
        return Workspace(id=workspace_id, owner_id=user_id, **data)

    async def add_workspace_member(self, workspace_id: UUID, user_id: UUID, role: RoleEnum, invited_by: UUID) -> WorkspaceMember:
        if not await self.is_workspace_admin(workspace_id, invited_by):
            raise PermissionError("Only workspace admins can add members")
        print(f"Adding user {user_id} to workspace {workspace_id} with role {role.value} by {invited_by}")
        return WorkspaceMember(id=UUID(), workspace_id=workspace_id, user_id=user_id, role=role)

    async def is_workspace_admin(self, workspace_id: UUID, user_id: UUID) -> bool:
        print(f"Checking if user {user_id} is admin of workspace {workspace_id}")
        # This would check the member's role in the database.
        return True

    async def delete_workspace(self, workspace_id: UUID, user_id: UUID) -> bool:
        if not await self.is_workspace_admin(workspace_id, user_id):
            raise PermissionError("Only workspace admins can delete a workspace")
        print(f"Deactivating workspace {workspace_id} by user {user_id}")
        # This would set workspace.is_active = False and save.
        return True

    async def remove_workspace_member(self, workspace_id: UUID, user_id: UUID, current_user_id: UUID) -> bool:
        if not await self.is_workspace_admin(workspace_id, current_user_id):
            raise PermissionError("Only workspace admins can remove a member")
        print(f"Removing user {user_id} from workspace {workspace_id} by user {current_user_id}")
        # This would delete the WorkspaceMember record.
        return True

    async def update_member_role(self, workspace_id: UUID, user_id: UUID, role: RoleEnum, current_user_id: UUID) -> WorkspaceMember:
        if not await self.is_workspace_admin(workspace_id, current_user_id):
            raise PermissionError("Only workspace admins can update a member role")
        member = WorkspaceMember(id=UUID(), workspace_id=workspace_id, user_id=user_id, role=role)
        # In a real scenario, you'd fetch the member first.
        if not member:
            raise NotFoundError("Member not found")
        print(f"Updating role for user {user_id} in workspace {workspace_id} to {role.value} by user {current_user_id}")
        # This would fetch the member, update the role, and save.
        return member

    async def get_workspace_members(self, workspace_id: UUID, current_user_id: UUID) -> List[WorkspaceMember]:
        print(f"Getting members for workspace {workspace_id}. Requester: {current_user_id}")
        return [WorkspaceMember(id=UUID(), workspace_id=workspace_id, user_id=current_user_id, role=RoleEnum.ADMIN)] 