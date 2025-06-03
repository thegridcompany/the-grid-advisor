"""
Pydantic models for Grid Brain database entities.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, EmailStr, validator
from uuid import UUID
import pendulum
from enum import Enum


class BaseDBModel(BaseModel):
    """Base model for all database entities."""
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class TeamMember(BaseDBModel):
    """Team member model."""
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None
    notification_preferences: Dict[str, Any] = Field(default_factory=dict)
    email_password_encrypted: Optional[str] = None
    last_email_sync: Optional[datetime] = None
    is_active: bool = True
    
    @validator("email")
    def validate_company_email(cls, v):
        if not v.endswith("@thegridcompany.it"):
            raise ValueError("Email must be from @thegridcompany.it domain")
        return v


class EmailAccount(BaseDBModel):
    """Email account configuration."""
    team_member_id: UUID
    email_address: EmailStr
    encrypted_password: str
    last_sync: Optional[datetime] = None
    sync_status: Literal["active", "error", "paused"] = "active"
    error_message: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)


class Client(BaseDBModel):
    """Client model."""
    name: str
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    notes: Optional[str] = None
    engagement_score: float = Field(default=0.0, ge=0.0, le=100.0)
    last_interaction: Optional[datetime] = None
    status: Literal["active", "inactive", "prospect", "churned"] = "active"
    assigned_to: Optional[UUID] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class InteractionType(str, Enum):
    """Interaction types."""
    EMAIL = "email"
    MEETING = "meeting"
    CALL = "call"
    TASK = "task"
    NOTE = "note"
    PROPOSAL = "proposal"
    INVOICE = "invoice"


class Interaction(BaseDBModel):
    """Interaction model."""
    type: InteractionType
    client_id: Optional[UUID] = None
    team_member_id: UUID
    subject: str
    content: Optional[str] = None
    sentiment: Optional[float] = Field(None, ge=-1.0, le=1.0)
    importance_score: float = Field(default=0.5, ge=0.0, le=1.0)
    
    # Email specific fields
    email_message_id: Optional[str] = None
    thread_id: Optional[str] = None
    email_from: Optional[str] = None
    email_to: Optional[List[str]] = None
    email_cc: Optional[List[str]] = None
    requires_response: bool = False
    response_deadline: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    
    # General metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    
    # AI analysis
    ai_summary: Optional[str] = None
    ai_suggested_actions: List[str] = Field(default_factory=list)
    ai_analysis_timestamp: Optional[datetime] = None


class LearnedPattern(BaseDBModel):
    """AI-learned pattern model."""
    pattern_type: Literal["behavior", "communication", "business", "risk"]
    pattern_description: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    occurrences: int = Field(default=1, ge=1)
    first_observed: datetime
    last_observed: datetime
    last_validated: Optional[datetime] = None
    
    # Pattern details
    conditions: Dict[str, Any] = Field(default_factory=dict)
    predictions: Dict[str, Any] = Field(default_factory=dict)
    
    # Effectiveness tracking
    predictions_made: int = Field(default=0)
    predictions_correct: int = Field(default=0)
    
    is_active: bool = True
    
    @property
    def success_rate(self) -> float:
        """Calculate pattern success rate."""
        if self.predictions_made == 0:
            return 0.0
        return self.predictions_correct / self.predictions_made


class AutomationRule(BaseDBModel):
    """Automation rule model."""
    name: str
    description: Optional[str] = None
    rule_type: Literal["alert", "action", "analysis"]
    is_active: bool = True
    
    # Trigger configuration
    trigger_conditions: Dict[str, Any]
    trigger_schedule: Optional[str] = None  # Cron expression
    
    # Action configuration
    actions: List[Dict[str, Any]]
    
    # Execution tracking
    last_triggered: Optional[datetime] = None
    trigger_count: int = Field(default=0)
    success_count: int = Field(default=0)
    error_count: int = Field(default=0)
    
    created_by: Optional[UUID] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Memory(BaseDBModel):
    """Memory/embedding storage model."""
    content_type: Literal["interaction", "pattern", "insight", "document"]
    content_id: UUID
    content_text: str
    embedding: List[float]
    
    # Memory categorization
    category: Optional[str] = None
    client_id: Optional[UUID] = None
    team_member_id: Optional[UUID] = None
    
    # Importance and decay
    importance_score: float = Field(default=0.5, ge=0.0, le=1.0)
    access_count: int = Field(default=0)
    last_accessed: Optional[datetime] = None
    
    # Memory metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    
    def decay_importance(self, decay_factor: float = 0.95) -> float:
        """Apply time-based decay to importance score."""
        if not self.created_at:
            return self.importance_score
        
        days_old = (pendulum.now() - pendulum.instance(self.created_at)).days
        decayed_score = self.importance_score * (decay_factor ** days_old)
        return max(0.1, decayed_score)  # Keep minimum score of 0.1


class Alert(BaseDBModel):
    """Alert model."""
    alert_type: Literal["response_overdue", "client_silent", "proposal_followup", "invoice_overdue", "custom"]
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    
    title: str
    message: str
    
    # Alert target
    team_member_id: UUID
    client_id: Optional[UUID] = None
    related_id: Optional[UUID] = None
    related_type: Optional[str] = None
    
    # Alert status
    status: Literal["pending", "acknowledged", "resolved", "expired"] = "pending"
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Actions
    suggested_actions: List[str] = Field(default_factory=list)
    action_taken: Optional[str] = None
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DailyBriefing(BaseDBModel):
    """Daily briefing model."""
    team_member_id: UUID
    briefing_date: datetime
    
    # Content sections
    summary: str
    key_metrics: Dict[str, Any]
    priority_items: List[Dict[str, Any]]
    follow_ups_needed: List[Dict[str, Any]]
    insights: List[str]
    
    # Delivery status
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    feedback: Optional[str] = None
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ClientHealth(BaseDBModel):
    """Client health snapshot model."""
    client_id: UUID
    snapshot_date: datetime
    
    # Health metrics
    engagement_score: float = Field(ge=0.0, le=100.0)
    response_time_avg: Optional[float] = None  # hours
    interaction_frequency: Optional[float] = None  # per month
    sentiment_trend: Optional[float] = Field(None, ge=-1.0, le=1.0)
    
    # Risk indicators
    churn_risk: float = Field(default=0.0, ge=0.0, le=1.0)
    days_since_contact: int = Field(default=0)
    
    # Recommendations
    recommended_actions: List[str] = Field(default_factory=list)
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UserRole(str, Enum):
    """Application user roles."""
    CONSULTANT_PO = "consultant_po"
    DEVELOPER = "developer"
    TECH_LEAD = "tech_lead"
    PARTNER_CFO = "partner_cfo"
    CLIENT = "client"


class User(BaseDBModel):
    """Application user model."""
    username: str = Field(unique=True, index=True)
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: str
    role: UserRole
    is_active: bool = Field(default=True)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    # Timestamps will be inherited from BaseDBModel
    # id will be inherited from BaseDBModel 


class Project(BaseDBModel):
    """Project model."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    owner_id: Optional[UUID] = None  # Foreign Key to User.id


class Epic(BaseDBModel):
    """Epic model."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: UUID  # Foreign Key to Project.id
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = Field("open", max_length=50)  # e.g., open, in_progress, completed


class TicketStatus(str, Enum):
    """Ticket status options."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    CLOSED = "closed"
    BACKLOG = "backlog"


class TicketPriority(str, Enum):
    """Ticket priority options."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Ticket(BaseDBModel):
    """Ticket model."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: TicketStatus = Field(default=TicketStatus.BACKLOG)
    priority: TicketPriority = Field(default=TicketPriority.MEDIUM)
    project_id: UUID  # Foreign Key to Project.id
    epic_id: Optional[UUID] = None  # Optional Foreign Key to Epic.id
    sprint_id: Optional[UUID] = None  # Optional Foreign Key to Sprint.id
    assignee_id: Optional[UUID] = None  # Optional Foreign Key to User.id
    reporter_id: Optional[UUID] = None  # Optional Foreign Key to User.id
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    tags: List[str] = Field(default_factory=list)
    embeddings: Optional[List[float]] = None # For pgvector


class Sprint(BaseDBModel):
    """Sprint model."""
    name: str = Field(..., min_length=1, max_length=255)
    project_id: UUID  # Foreign Key to Project.id
    start_date: datetime
    end_date: datetime
    goal: Optional[str] = None
    status: Optional[str] = Field("planned", max_length=50)  # e.g., planned, active, completed


class Comment(BaseDBModel):
    """Comment model."""
    content: str
    ticket_id: UUID  # Foreign Key to Ticket.id
    user_id: UUID  # Foreign Key to User.id
    parent_comment_id: Optional[UUID] = None # For threaded comments 