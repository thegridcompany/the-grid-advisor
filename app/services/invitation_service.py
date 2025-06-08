import secrets
from datetime import datetime, timedelta
from uuid import UUID

from app.db.models import UserInvitation, User, Workspace, TeamMember, RoleEnum
# Assuming EmailService will be created
# from .email_service import EmailService 
from app.services.workspace_service import WorkspaceService
from app.core.config import settings

# Placeholder for EmailService
class EmailService:
    async def send_email(self, to_email: str, subject: str, template: str, template_data: dict):
        print(f"--- MOCK EMAIL ---")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Template: {template}")
        print(f"Data: {template_data}")
        print(f"--- END MOCK EMAIL ---")
        return True


class InvitationService:
    def __init__(self):
        self.email_service = EmailService()

    async def create_invitation(self, email: str, workspace_id: UUID, role: RoleEnum, invited_by: UUID) -> UserInvitation:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=48)
        
        invitation = await UserInvitation.create(
            email=email,
            workspace_id=workspace_id,
            role=role,
            invited_by=invited_by,
            token=token,
            expires_at=expires_at,
            status='pending'
        )
        
        await self.send_invitation_email(invitation)
        return invitation

    async def create_client_invitation(self, email: str, workspace_id: UUID, project_ids: list[str], invited_by: UUID) -> UserInvitation:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=48)
        
        invitation = await UserInvitation.create(
            email=email,
            workspace_id=workspace_id,
            role=RoleEnum.CLIENT,
            invited_by=invited_by,
            token=token,
            expires_at=expires_at,
            status='pending',
            metadata={"project_ids": project_ids}
        )
        
        await self.send_invitation_email(invitation)
        return invitation

    async def send_invitation_email(self, invitation: UserInvitation):
        workspace = await Workspace.get(id=invitation.workspace_id)
        inviter = await User.get(id=invitation.invited_by)

        invite_url = f"{settings.FRONTEND_URL}/invite/{invitation.token}"
        
        template_data = {
            "workspace_name": workspace.name,
            "inviter_name": f"{inviter.first_name} {inviter.last_name}",
            "invite_url": invite_url,
            "expires_at": invitation.expires_at.strftime("%Y-%m-%d %H:%M UTC")
        }
        
        await self.email_service.send_email(
            to_email=invitation.email,
            subject=f"You've been invited to join {workspace.name} on Grid Brain",
            template="workspace_invitation",
            template_data=template_data
        )

    async def verify_invitation(self, token: str) -> UserInvitation:
        invitation = await UserInvitation.get_or_none(token=token)

        if not invitation:
            raise ValueError("Invalid invitation token")
        
        if invitation.status != "pending":
            raise ValueError(f"Invitation is {invitation.status}")
        
        if invitation.expires_at < datetime.utcnow():
            invitation.status = "expired"
            await invitation.save()
            raise ValueError("Invitation has expired")
        
        return invitation

    async def accept_invitation(self, token: str, user_id: UUID) -> UserInvitation:
        invitation = await self.verify_invitation(token)
        
        invitation.status = "accepted"
        invitation.accepted_at = datetime.utcnow()
        await invitation.save()

        workspace_service = WorkspaceService()
        await workspace_service.add_workspace_member(
            workspace_id=invitation.workspace_id,
            user_id=user_id,
            role=invitation.role,
            invited_by=invitation.invited_by
        )
        
        return invitation 