from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    SUPPORT_AGENT = "SUPPORT_AGENT"
    TEAM_LEAD = "TEAM_LEAD"
    ADMIN = "ADMIN"

class TicketCategory(str, Enum):
    ORDER_NOT_RECEIVED = "ORDER_NOT_RECEIVED"
    WRONG_ITEM = "WRONG_ITEM"
    DAMAGED_ITEM = "DAMAGED_ITEM"
    CANCEL_ORDER = "CANCEL_ORDER"
    REFUND = "REFUND"
    RETURN = "RETURN"
    PAYMENT_ISSUE = "PAYMENT_ISSUE"
    DELIVERY_ISSUE = "DELIVERY_ISSUE"

class TicketStatus(str, Enum):
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class TicketPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class User(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    password_hash: str
    role: UserRole = Field(default=UserRole.CUSTOMER)
    created_at: datetime = Field(default_factory=get_utc_now)

class Order(SQLModel, table=True):
    id: str = Field(primary_key=True)
    customer_id: str = Field(index=True)
    items_json: str = Field(default="[]") # JSON string of items
    total_amount: float
    payment_status: str
    delivery_status: str
    order_date: datetime = Field(default_factory=get_utc_now)

class Ticket(SQLModel, table=True):
    id: str = Field(primary_key=True)
    customer_id: str = Field(index=True)
    order_id: str = Field(index=True)
    category: TicketCategory
    subject: str
    description: str
    status: TicketStatus = Field(default=TicketStatus.NEW)
    priority: TicketPriority = Field(default=TicketPriority.MEDIUM)
    assigned_agent_id: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class Comment(SQLModel, table=True):
    id: str = Field(primary_key=True)
    ticket_id: str = Field(index=True)
    user_id: str
    user_name: str
    user_role: UserRole
    message: str
    is_internal: bool = Field(default=False)
    created_at: datetime = Field(default_factory=get_utc_now)

class Attachment(SQLModel, table=True):
    id: str = Field(primary_key=True)
    ticket_id: str = Field(index=True)
    file_name: str
    file_url: str
    uploaded_by_id: str
    uploaded_by_name: str
    created_at: datetime = Field(default_factory=get_utc_now)

class AuditLog(SQLModel, table=True):
    id: str = Field(primary_key=True)
    ticket_id: Optional[str] = Field(default=None, index=True)
    action: str
    performed_by_id: str
    performed_by_name: str
    performed_by_role: UserRole
    details: str
    created_at: datetime = Field(default_factory=get_utc_now)
