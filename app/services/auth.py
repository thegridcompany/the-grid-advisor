"""
Authentication service for Grid Brain.
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID, uuid4
from jose import jwt, exceptions
from email_validator import validate_email
import secrets
import pendulum
import asyncio
from functools import partial

from ..core.database import get_db_manager, get_supabase
from ..core.config import settings
from ..core.logging import get_logger
from ..email.client import EmailClient
from ..db.models import TeamMember, User, UserRole, Workspace, WorkspaceMember
from ..core.auth import pwd_context, create_access_token, verify_password, get_password_hash

logger = get_logger(__name__)


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self):
        self.db = get_db_manager()
        self.supabase = get_supabase()
    
    async def send_magic_link(self, email: str) -> Dict[str, Any]:
        """Send magic link to user email."""
        try:
            # Validate email format
            validated = validate_email(email)
            email = validated.email
            
            # Check if email is from company domain
            if not email.endswith(f"@{settings.company_email_domain}"):
                return {
                    "status": "error",
                    "message": f"Access restricted to @{settings.company_email_domain} emails only"
                }
            
            # Check if team member exists
            team_member = await self._get_team_member_by_email(email)
            if not team_member:
                return {
                    "status": "error",
                    "message": "No team member found with this email"
                }
            
            if not team_member.get("is_active"):
                return {
                    "status": "error",
                    "message": "Team member account is inactive"
                }
            
            # Generate magic link token
            token = self._generate_magic_token(team_member["id"], email)
            
            # Create magic link URL
            magic_link = f"{settings.frontend_url}/auth/verify?token={token}"
            
            # Send email
            email_sent = await self._send_magic_link_email(email, team_member["name"], magic_link)
            
            if email_sent:
                logger.info(f"Magic link sent to {email}")
                return {
                    "status": "success",
                    "message": "Magic link sent to your email"
                }
            else:
                return {
                    "status": "error",
                    "message": "Failed to send magic link email"
                }
                
        except Exception as e:
            logger.error(f"Failed to send magic link: {str(e)}")
            return {
                "status": "error",
                "message": "An error occurred while sending magic link"
            }
    
    async def verify_magic_link(self, token: str) -> Dict[str, Any]:
        """Verify magic link token and authenticate user."""
        try:
            # Decode and verify token
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm]
            )
            
            # Check if token is expired
            expires_at = datetime.fromtimestamp(payload["exp"])
            if datetime.utcnow() > expires_at:
                return {
                    "status": "error",
                    "message": "Magic link has expired"
                }
            
            # Get team member
            team_member_id = payload["sub"]
            email = payload["email"]
            
            team_member = await self.db.get_by_id("team_members", team_member_id)
            if not team_member or team_member["email"] != email:
                return {
                    "status": "error",
                    "message": "Invalid magic link"
                }
            
            # Generate access token
            access_token = self._generate_access_token(team_member)
            
            # Update last login
            await self.db.update(
                "team_members",
                team_member_id,
                {"last_login": pendulum.now().isoformat()}
            )
            
            return {
                "status": "success",
                "access_token": access_token,
                "team_member": {
                    "id": team_member["id"],
                    "email": team_member["email"],
                    "name": team_member["name"],
                    "role": team_member["role"]
                }
            }
            
        except jwt.ExpiredSignatureError:
            return {
                "status": "error",
                "message": "Magic link has expired"
            }
        except exceptions.JWTError:
            return {
                "status": "error",
                "message": "Invalid magic link"
            }
        except Exception as e:
            logger.error(f"Failed to verify magic link: {str(e)}")
            return {
                "status": "error",
                "message": "Failed to verify magic link"
            }
    
    async def verify_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify access token and return team member info."""
        try:
            # Decode token
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm]
            )
            
            # Get team member
            team_member_id = payload["sub"]
            team_member = await self.db.get_by_id("team_members", team_member_id)
            
            if not team_member or not team_member.get("is_active"):
                return None
            
            return {
                "id": team_member["id"],
                "email": team_member["email"],
                "name": team_member["name"],
                "role": team_member["role"]
            }
            
        except Exception as e:
            logger.error(f"Failed to verify access token: {str(e)}")
            return None
    
    async def _get_team_member_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get team member by email."""
        members = await self.db.get_many(
            "team_members",
            filters={"email": email}
        )
        return members[0] if members else None
    
    async def _send_magic_link_email(self, email: str, name: str, magic_link: str) -> bool:
        """Send magic link email to user."""
        try:
            subject = "Your Grid Brain Login Link"

            body = f"""Hi {name},

Click the link below to log in to Grid Brain:

{magic_link}

This link will expire in 15 minutes for security reasons.

If you didn't request this link, please ignore this email.

Best regards,
Grid Brain AI
"""

            html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Your Grid Brain Login Link</h2>
        <p>Hi {name},</p>
        <p>Click the button below to log in to Grid Brain:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{magic_link}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Log in to Grid Brain
            </a>
        </div>
        <p style="color: #7f8c8d; font-size: 14px;">This link will expire in 15 minutes for security reasons.</p>
        <p style="color: #7f8c8d; font-size: 14px;">If you didn't request this link, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
        <p style="color: #95a5a6; font-size: 12px;">Best regards,<br>Grid Brain AI</p>
    </div>
</body>
</html>
"""

            # Use EmailClient to send the email
            if settings.system_email_address and settings.system_email_password:
                email_client = EmailClient(
                    email_address=settings.system_email_address,
                    password=settings.system_email_password
                )
                # Note: EmailClient.send_email is not async, so we run it in a thread pool
                # to avoid blocking the event loop if it were called in an async context.
                # However, _send_magic_link_email itself is called from an async function
                # so we need to handle this properly if we were to make EmailClient async.
                # For now, direct call as _send_magic_link_email is awaited.
                # If EmailClient methods become async, this would need `await`.
                # This function as a whole should ideally be async if EmailClient is async.
                # For simplicity and since EmailClient is currently sync, we call it directly.
                
                # The send_email method in EmailClient is synchronous.
                # To call it from an async function without blocking, 
                # it should ideally be run in a thread pool executor.
                # However, given the current structure, and for simplicity of this step,
                # we'll call it directly. This can be revisited for performance if it becomes a bottleneck.
                loop = asyncio.get_event_loop()
                # Prepara la funzione con tutti gli argomenti usando functools.partial
                func_to_run = partial(
                    email_client.send_email,
                    [email],
                    subject,
                    body,
                    html_body=html_body
                )
                return await loop.run_in_executor(
                    None, 
                    func_to_run
                )
            else:
                logger.warning("System email address or password not configured. Cannot send magic link email.")
                logger.info(f"Magic link for {email} (not sent): {magic_link}")
                return False

        except Exception as e:
            logger.error(f"Failed to send magic link email: {str(e)}", exc_info=True)
            return False
    
    async def create_team_member(
        self,
        email: str,
        name: str,
        role: str,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new team member."""
        try:
            # Validate email
            validated = validate_email(email)
            email = validated.email
            
            # Check domain
            if not email.endswith(f"@{settings.company_email_domain}"):
                return {
                    "status": "error",
                    "message": f"Email must be from @{settings.company_email_domain} domain"
                }
            
            # Check if already exists
            existing = await self._get_team_member_by_email(email)
            if existing:
                return {
                    "status": "error",
                    "message": "Team member with this email already exists"
                }
            
            # Create team member
            team_member_data = {
                "email": email,
                "name": name,
                "role": role,
                "phone": phone,
                "is_active": True,
                "notification_preferences": {
                    "email": True,
                    "daily_briefing": True,
                    "alerts": True
                }
            }
            
            team_member = await self.db.create("team_members", team_member_data)
            
            logger.info(f"Created team member: {email}")
            
            return {
                "status": "success",
                "team_member": team_member
            }
            
        except Exception as e:
            logger.error(f"Failed to create team member: {str(e)}")
            return {
                "status": "error",
                "message": "Failed to create team member"
            }
    
    async def register_user(self, username: str, email: str, password: str, role: UserRole, first_name: Optional[str] = None, last_name: Optional[str] = None) -> Dict[str, Any]:
        """Register a new application user."""
        try:
            # Validate email
            validated = validate_email(email)
            email_to_save = validated.email

            # Check if user already exists by email or username
            existing_by_email = await self.db.get_many("users", filters={"email": email_to_save})
            if existing_by_email:
                return {"status": "error", "message": "User with this email already exists"}
            
            existing_by_username = await self.db.get_many("users", filters={"username": username})
            if existing_by_username:
                return {"status": "error", "message": "User with this username already exists"}

            hashed_password = get_password_hash(password)
            
            user_data = {
                "username": username,
                "email": email_to_save,
                "hashed_password": hashed_password,
                "role": role.value,
                "is_active": True,
                "first_name": first_name,
                "last_name": last_name,
            }
            
            # Assuming self.db.create can handle direct dicts for table "users"
            # and returns the created user dict or User model instance
            created_user_dict = await self.db.create("users", user_data) 
            
            # Ensure created_user_dict has an 'id' before creating a User model instance from it
            # The actual structure of created_user_dict depends on your db_manager implementation
            if not created_user_dict or "id" not in created_user_dict:
                 logger.error(f"User creation in DB failed or did not return ID for {email}")
                 return {"status": "error", "message": "User creation failed"}

            logger.info(f"Registered new user: {email_to_save}")
            return {"status": "success", "user_id": str(created_user_dict['id'])}

        except Exception as e:
            logger.error(f"Failed to register user {email}: {str(e)}", exc_info=True)
            return {"status": "error", "message": f"Failed to register user: {str(e)}"}

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user by email and password."""
        users = await self.db.get_many("users", filters={"email": email})
        if not users:
            return None
        
        user_dict = users[0] # Assuming email is unique
        
        if not verify_password(password, user_dict.get("hashed_password")):
            return None
        
        # Convert dict to User model instance
        # Ensure all necessary fields are present in user_dict or handle missing ones
        try:
            # Role needs to be converted back to UserRole enum from string
            user_dict["role"] = UserRole(user_dict["role"])
            return User(**user_dict)
        except Exception as e:
            logger.error(f"Failed to parse authenticated user data for {email}: {e}")
            return None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        users = await self.db.get_many("users", filters={"email": email})
        if not users:
            return None
        user_dict = users[0]
        try:
            user_dict["role"] = UserRole(user_dict["role"])
            return User(**user_dict)
        except Exception as e:
            logger.error(f"Failed to parse user data for {email}: {e}")
            return None
            
    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        user_dict = await self.db.get_by_id("users", str(user_id)) # Ensure ID is string for DB
        if not user_dict:
            # Fallback to check team_members if no user is found
            team_member_dict = await self.db.get_by_id("team_members", str(user_id))
            if not team_member_dict:
                return None
            # Adapt team_member dict to a User-like structure
            # This is a temporary adaptation. A unified user model is better.
            return User(
                id=team_member_dict["id"],
                email=team_member_dict["email"],
                username=team_member_dict["email"].split('@')[0], # Generate username
                role=UserRole.TECH_LEAD if team_member_dict["role"] == "CTO" else UserRole.CONSULTANT_PO, # Map role
                is_active=team_member_dict["is_active"],
                first_name=team_member_dict["name"].split(" ")[0],
                last_name=" ".join(team_member_dict["name"].split(" ")[1:]),
                hashed_password="" # No password for team members
            )

        try:
            user_dict["role"] = UserRole(user_dict["role"])
            # Add placeholder fields that might be missing from DB dict
            user_dict.setdefault('first_name', None)
            user_dict.setdefault('last_name', None)
            return User(**user_dict)
        except Exception as e:
            logger.error(f"Failed to parse user data for ID {user_id}: {e}")
            return None

    async def verify_user_access_token(self, token: str) -> Optional[User]:
        """Verify access token and return User model instance with workspace context."""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY, # Use the main secret key
                algorithms=[settings.ALGORITHM]
            )
            user_id_str = payload.get("sub")
            if not user_id_str:
                return None
            
            user = await self.get_user_by_id(UUID(user_id_str))
            
            if not user or not user.is_active:
                return None

            # Attach workspace context from token to the user object
            user.current_workspace_id = payload.get("workspace_id")
            user.current_workspace_role = payload.get("workspace_role")
            
            return user
            
        except exceptions.JWTError:
            logger.warning(f"Invalid JWT token received.")
            return None
        except Exception as e:
            logger.error(f"Failed to verify user access token: {str(e)}")
            return None 