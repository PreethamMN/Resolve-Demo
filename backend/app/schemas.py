from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr
from app.models import UserRole, TicketCategory, TicketStatus, TicketPriority

# Auth
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.CUSTOMER

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

# Orders
class OrderItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    price: float

class OrderOut(BaseModel):
    id: str
    customer_id: str
    items: List[OrderItem]
    total_amount: float
    payment_status: str
    delivery_status: str
    order_date: datetime

    class Config:
        from_attributes = True

# Tickets
class TicketCreate(BaseModel):
    order_id: str
    category: TicketCategory
    subject: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM

class TicketAssign(BaseModel):
    agent_id: str

class TicketStatusUpdate(BaseModel):
    status: TicketStatus

class TicketOut(BaseModel):
    id: str
    customer_id: str
    customer_name: Optional[str] = None
    order_id: str
    category: TicketCategory
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    assigned_agent_id: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Comments
class CommentCreate(BaseModel):
    message: str
    is_internal: bool = False

class CommentOut(BaseModel):
    id: str
    ticket_id: str
    user_id: str
    user_name: str
    user_role: UserRole
    message: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Attachments
class AttachmentOut(BaseModel):
    id: str
    ticket_id: str
    file_name: str
    file_url: str
    uploaded_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Logs
class AuditLogOut(BaseModel):
    id: str
    ticket_id: Optional[str]
    action: str
    performed_by_name: str
    performed_by_role: UserRole
    details: str
    created_at: datetime

    class Config:
        from_attributes = True

# System Stats
class SystemStats(BaseModel):
    total_tickets: int
    new_tickets: int
    assigned_tickets: int
    in_progress_tickets: int
    on_hold_tickets: int
    resolved_tickets: int
    closed_tickets: int
    tickets_by_category: dict
    tickets_by_agent: dict
    total_customers: int
    total_agents: int
