"""
Email service for managing email synchronization and processing.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from uuid import UUID
import asyncio
import pendulum
from cryptography.fernet import Fernet

from .client import EmailClient
from ..core.database import get_db_manager, get_supabase
from ..core.logging import get_logger, LoggerMixin
from ..core.config import settings
from ..db.models import TeamMember, EmailAccount, Interaction, Client, InteractionType, Alert
from ..ai.analyzer import AIAnalyzer

logger = get_logger(__name__)


class EmailService(LoggerMixin):
    """Service for email operations and synchronization."""
    
    def __init__(self):
        self.db = get_db_manager()
        self.supabase = get_supabase()
        self.ai_analyzer = AIAnalyzer()
        self._fernet = Fernet(settings.encryption_key.encode())
    
    def encrypt_password(self, password: str) -> str:
        """Encrypt email password."""
        return self._fernet.encrypt(password.encode()).decode()
    
    def decrypt_password(self, encrypted_password: str) -> str:
        """Decrypt email password."""
        return self._fernet.decrypt(encrypted_password.encode()).decode()
    
    async def sync_team_member_emails(self, team_member_id: UUID) -> Dict[str, Any]:
        """Sync emails for a specific team member."""
        email_account = None
        try:
            # Get team member and email account
            team_member = await self.db.get_by_id("team_members", str(team_member_id))
            if not team_member:
                raise ValueError(f"Team member {team_member_id} not found")
            
            email_account = await self._get_email_account(team_member_id)
            if not email_account:
                self.log_warning("No email account configured", team_member_id=str(team_member_id))
                return {"status": "error", "message": "No email account configured"}
            
            # Decrypt password
            password = self.decrypt_password(email_account["encrypted_password"])
            
            # Connect and sync
            with EmailClient(email_account["email_address"], password) as client:
                # Determine sync date
                last_sync = email_account.get("last_sync")
                if last_sync:
                    since_date = pendulum.parse(last_sync)
                else:
                    since_date = pendulum.now().subtract(days=30)
                
                # Fetch emails
                emails = client.fetch_emails(since_date=since_date.to_datetime_string())
                
                # Process each email
                new_interactions = []
                for email_data in emails:
                    interaction = await self._process_email(email_data, team_member_id)
                    if interaction:
                        new_interactions.append(interaction)
                
                # Update last sync time
                await self.db.update(
                    "email_accounts",
                    email_account["id"],
                    {
                        "last_sync": pendulum.now().isoformat(),
                        "sync_status": "active",
                        "error_message": None
                    }
                )
                
                self.log_event(
                    "email_sync_completed",
                    team_member_id=str(team_member_id),
                    emails_processed=len(emails),
                    new_interactions=len(new_interactions)
                )
                
                return {
                    "status": "success",
                    "emails_processed": len(emails),
                    "new_interactions": len(new_interactions)
                }
                
        except Exception as e:
            self.log_error("Email sync failed", exception=e, team_member_id=str(team_member_id))
            
            # Update sync status with error
            if email_account:
                await self.db.update(
                    "email_accounts",
                    email_account["id"],
                    {
                        "sync_status": "error",
                        "error_message": str(e)
                    }
                )
            
            return {"status": "error", "message": str(e)}
    
    async def _get_email_account(self, team_member_id: UUID) -> Optional[Dict[str, Any]]:
        """Get email account for team member."""
        accounts = await self.db.get_many(
            "email_accounts",
            filters={"team_member_id": str(team_member_id)}
        )
        return accounts[0] if accounts else None
    
    async def _process_email(self, email_data: Dict[str, Any], team_member_id: UUID) -> Optional[Dict[str, Any]]:
        """Process a single email and create interaction."""
        try:
            # Check if email already exists
            existing = await self.db.get_many(
                "interactions",
                filters={
                    "email_message_id": email_data["message_id"],
                    "team_member_id": str(team_member_id)
                }
            )
            
            if existing:
                return None  # Already processed
            
            # Extract client from email
            client = await self._identify_or_create_client(email_data["from"])
            
            # Calculate importance
            email_client = EmailClient("", "")  # Dummy instance for static method
            _, importance_score = email_client.is_important_email(email_data)
            
            # Check if requires response
            requires_response = self._check_requires_response(email_data, str(team_member_id))
            response_deadline = None
            if requires_response:
                response_deadline = pendulum.now().add(hours=settings.response_time_alert_hours)
            
            # Create interaction
            interaction_data = {
                "type": InteractionType.EMAIL,
                "client_id": client["id"] if client else None,
                "team_member_id": str(team_member_id),
                "subject": email_data["subject"],
                "content": email_data["text_content"][:5000],  # Limit content size
                "importance_score": importance_score,
                "email_message_id": email_data["message_id"],
                "thread_id": email_data.get("references"),
                "email_from": email_data["from"],
                "email_to": email_data["to"],
                "email_cc": email_data.get("cc", []),
                "requires_response": requires_response,
                "response_deadline": response_deadline.isoformat() if response_deadline else None,
                "metadata": {
                    "has_attachments": email_data["has_attachments"],
                    "attachment_count": email_data["attachment_count"],
                    "flags": email_data["flags"]
                }
            }
            
            interaction = await self.db.create("interactions", interaction_data)
            
            # Trigger AI analysis if important
            if importance_score >= settings.ai_analysis_threshold:
                asyncio.create_task(self._analyze_email_with_ai(interaction))
            
            # Create alert if requires urgent response
            if requires_response and importance_score >= 0.8:
                await self._create_response_alert(interaction, team_member_id)
            
            return interaction
            
        except Exception as e:
            self.log_error("Failed to process email", exception=e, message_id=email_data.get("message_id"))
            return None
    
    async def _identify_or_create_client(self, email_address: str) -> Optional[Dict[str, Any]]:
        """Identify existing client or create new one from email."""
        try:
            # Search for existing client
            clients = await self.db.get_many(
                "clients",
                filters={"email": email_address}
            )
            
            if clients:
                return clients[0]
            
            # Extract domain
            email_client = EmailClient("", "")  # Dummy instance for static method
            domain = email_client.extract_domain_from_email(email_address)
            
            # Create new client
            client_data = {
                "name": email_address.split("@")[0].replace(".", " ").title(),
                "email": email_address,
                "company": domain,
                "status": "prospect"
            }
            
            return await self.db.create("clients", client_data)
            
        except Exception as e:
            self.log_error("Failed to identify/create client", exception=e, email=email_address)
            return None
    
    def _check_requires_response(self, email_data: Dict[str, Any], team_member_email: str) -> bool:
        """Check if email requires a response."""
        # If it's sent TO us (not CC), likely requires response
        if team_member_email in email_data.get("to", []):
            # Check if it's a reply to something we sent
            if not email_data.get("in_reply_to"):
                return True
            
            # Check for question marks in content
            content = email_data.get("text_content", "")
            if "?" in content:
                return True
        
        return False
    
    async def _analyze_email_with_ai(self, interaction: Dict[str, Any]) -> None:
        """Analyze email with AI for insights and suggestions."""
        try:
            analysis = await self.ai_analyzer.analyze_interaction(interaction)
            
            # Update interaction with AI analysis
            await self.db.update(
                "interactions",
                interaction["id"],
                {
                    "sentiment": analysis.get("sentiment"),
                    "ai_summary": analysis.get("summary"),
                    "ai_suggested_actions": analysis.get("suggested_actions", []),
                    "ai_analysis_timestamp": pendulum.now().isoformat()
                }
            )
            
            self.log_event("email_ai_analysis_completed", interaction_id=interaction["id"])
            
        except Exception as e:
            self.log_error("AI analysis failed", exception=e, interaction_id=interaction["id"])
    
    async def _create_response_alert(self, interaction: Dict[str, Any], team_member_id: UUID) -> None:
        """Create alert for required response."""
        try:
            alert_data = {
                "alert_type": "response_overdue",
                "severity": "high",
                "title": f"Response required: {interaction['subject']}",
                "message": f"Email from {interaction['email_from']} requires your response",
                "team_member_id": str(team_member_id),
                "client_id": interaction.get("client_id"),
                "related_id": interaction["id"],
                "related_type": "interaction",
                "expires_at": interaction["response_deadline"],
                "suggested_actions": ["Reply to email", "Schedule follow-up call"]
            }
            
            await self.db.create("alerts", alert_data)
            
        except Exception as e:
            self.log_error("Failed to create response alert", exception=e)
    
    async def sync_all_team_emails(self) -> Dict[str, Any]:
        """Sync emails for all active team members."""
        results = {
            "total": 0,
            "success": 0,
            "errors": 0,
            "details": []
        }
        
        try:
            # Get all active team members
            team_members = await self.db.get_many(
                "team_members",
                filters={"is_active": True}
            )
            
            results["total"] = len(team_members)
            
            # Sync each team member's emails
            for member in team_members:
                result = await self.sync_team_member_emails(UUID(member["id"]))
                
                if result["status"] == "success":
                    results["success"] += 1
                else:
                    results["errors"] += 1
                
                results["details"].append({
                    "team_member": member["name"],
                    "email": member["email"],
                    **result
                })
            
            self.log_event("all_team_emails_synced", **results)
            
        except Exception as e:
            self.log_error("Failed to sync all team emails", exception=e)
        
        return results
    
    async def setup_email_account(
        self, 
        team_member_id: UUID, 
        email_address: str, 
        password: str
    ) -> Dict[str, Any]:
        """Set up email account for a team member."""
        try:
            # Validate email matches team member
            team_member = await self.db.get_by_id("team_members", str(team_member_id))
            if not team_member or team_member["email"] != email_address:
                raise ValueError("Email address doesn't match team member")
            
            # Test connection
            with EmailClient(email_address, password) as client:
                # Connection successful
                pass
            
            # Encrypt password
            encrypted_password = self.encrypt_password(password)
            
            # Create or update email account
            account_data = {
                "team_member_id": str(team_member_id),
                "email_address": email_address,
                "encrypted_password": encrypted_password,
                "sync_status": "active"
            }
            
            existing = await self._get_email_account(team_member_id)
            if existing:
                account = await self.db.update("email_accounts", existing["id"], account_data)
            else:
                account = await self.db.create("email_accounts", account_data)
            
            # Update team member
            await self.db.update(
                "team_members",
                str(team_member_id),
                {"email_password_encrypted": encrypted_password}
            )
            
            self.log_event("email_account_setup", team_member_id=str(team_member_id))
            
            return {"status": "success", "account_id": account["id"]}
            
        except Exception as e:
            self.log_error("Failed to setup email account", exception=e)
            return {"status": "error", "message": str(e)} 