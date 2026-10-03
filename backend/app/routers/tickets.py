import os
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select

from app.config import UPLOAD_DIR
from app.database import get_session, mongo_insert_or_update
from app.models import (
    Ticket, TicketStatus, TicketCategory, TicketPriority, User, UserRole,
    Comment, Attachment, AuditLog, Order
)
from app.schemas import (
    TicketCreate, TicketOut, TicketAssign, TicketStatusUpdate,
    CommentCreate, CommentOut, AttachmentOut
)
from app.security import oauth2_scheme, get_current_user_from_token, require_role

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

def get_now() -> datetime:
    return datetime.now(timezone.utc)

def format_ticket(ticket: Ticket, session: Session) -> TicketOut:
    customer = session.get(User, ticket.customer_id)
    agent = session.get(User, ticket.assigned_agent_id) if ticket.assigned_agent_id else None
    
    return TicketOut(
        id=ticket.id,
        customer_id=ticket.customer_id,
        customer_name=customer.name if customer else "Unknown Customer",
        order_id=ticket.order_id,
        category=ticket.category,
        subject=ticket.subject,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        assigned_agent_id=ticket.assigned_agent_id,
        assigned_agent_name=agent.name if agent else None,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at
    )

def log_audit(session: Session, ticket_id: str, action: str, user: User, details: str):
    now = get_now()
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:8]}",
        ticket_id=ticket_id,
        action=action,
        performed_by_id=user.id,
        performed_by_name=user.name,
        performed_by_role=user.role,
        details=details,
        created_at=now
    )
    session.add(audit)
    mongo_insert_or_update("audit_logs", audit.id, {
        "ticket_id": ticket_id,
        "action": action,
        "performed_by_id": user.id,
        "performed_by_name": user.name,
        "performed_by_role": user.role,
        "details": details,
        "created_at": now.isoformat()
    })

@router.post("", response_model=TicketOut)
def create_ticket(
    payload: TicketCreate,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    
    # Validate order belongs to customer if user is CUSTOMER
    order = session.get(Order, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == UserRole.CUSTOMER and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Order does not belong to customer")

    ticket_id = f"TKT-{uuid.uuid4().hex[:6].upper()}"
    now = get_now()
    ticket = Ticket(
        id=ticket_id,
        customer_id=current_user.id,
        order_id=payload.order_id,
        category=payload.category,
        subject=payload.subject,
        description=payload.description,
        priority=payload.priority,
        status=TicketStatus.NEW,
        created_at=now,
        updated_at=now
    )
    session.add(ticket)
    
    log_audit(session, ticket_id, "ticket_created", current_user, f"Ticket created for order {payload.order_id} with category {payload.category.value}")
    session.commit()
    session.refresh(ticket)
    return format_ticket(ticket, session)

@router.get("", response_model=List[TicketOut])
def list_tickets(
    status: Optional[TicketStatus] = None,
    category: Optional[TicketCategory] = None,
    priority: Optional[TicketPriority] = None,
    assigned_agent_id: Optional[str] = None,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    query = select(Ticket)

    # Role permissions
    if current_user.role == UserRole.CUSTOMER:
        query = query.where(Ticket.customer_id == current_user.id)
    elif current_user.role == UserRole.SUPPORT_AGENT:
        # Agents see tickets assigned to them or unassigned/all if requested
        if assigned_agent_id:
            query = query.where(Ticket.assigned_agent_id == assigned_agent_id)
        else:
            query = query.where(Ticket.assigned_agent_id == current_user.id)

    # Filters
    if status:
        query = query.where(Ticket.status == status)
    if category:
        query = query.where(Ticket.category == category)
    if priority:
        query = query.where(Ticket.priority == priority)

    tickets = session.exec(query.order_by(Ticket.updated_at.desc())).all()
    return [format_ticket(t, session) for t in tickets]

@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: str,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")

    return format_ticket(ticket, session)

@router.post("/{ticket_id}/assign", response_model=TicketOut)
def assign_ticket(
    ticket_id: str,
    payload: TicketAssign,
    session: Session = Depends(get_session),
    team_lead: User = Depends(require_role([UserRole.TEAM_LEAD, UserRole.ADMIN]))
):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    agent = session.get(User, payload.agent_id)
    if not agent or agent.role not in [UserRole.SUPPORT_AGENT, UserRole.TEAM_LEAD, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid support agent selected")

    prev_agent = ticket.assigned_agent_id
    ticket.assigned_agent_id = agent.id
    ticket.status = TicketStatus.ASSIGNED if ticket.status == TicketStatus.NEW else ticket.status
    ticket.updated_at = get_now()
    
    session.add(ticket)
    log_action = "ticket_reassigned" if prev_agent else "ticket_assigned"
    log_audit(session, ticket_id, log_action, team_lead, f"Assigned ticket to {agent.name}")
    session.commit()
    session.refresh(ticket)
    return format_ticket(ticket, session)

@router.post("/{ticket_id}/status", response_model=TicketOut)
def update_ticket_status(
    ticket_id: str,
    payload: TicketStatusUpdate,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.CUSTOMER:
        if payload.status not in [TicketStatus.CLOSED, TicketStatus.RESOLVED]:
            raise HTTPException(status_code=403, detail="Customers can only confirm resolution or close tickets")
        if ticket.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    old_status = ticket.status
    ticket.status = payload.status
    now = get_now()
    ticket.updated_at = now

    if payload.status == TicketStatus.RESOLVED and not ticket.resolved_at:
        ticket.resolved_at = now
    if payload.status == TicketStatus.CLOSED and not ticket.closed_at:
        ticket.closed_at = now

    session.add(ticket)
    log_audit(session, ticket_id, "status_changed", current_user, f"Status changed from {old_status.value} to {payload.status.value}")
    session.commit()
    session.refresh(ticket)
    return format_ticket(ticket, session)

# Comments
@router.get("/{ticket_id}/comments", response_model=List[CommentOut])
def get_comments(
    ticket_id: str,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = select(Comment).where(Comment.ticket_id == ticket_id)
    if current_user.role == UserRole.CUSTOMER:
        query = query.where(Comment.is_internal == False)

    return session.exec(query.order_by(Comment.created_at.asc())).all()

@router.post("/{ticket_id}/comments", response_model=CommentOut)
def add_comment(
    ticket_id: str,
    payload: CommentCreate,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.CUSTOMER:
        if ticket.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        payload.is_internal = False # Customers can't post internal notes

    now = get_now()
    comment = Comment(
        id=f"CMT-{uuid.uuid4().hex[:6]}",
        ticket_id=ticket_id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        message=payload.message,
        is_internal=payload.is_internal,
        created_at=now
    )
    session.add(comment)

    # Auto update ticket timestamp
    ticket.updated_at = now
    if current_user.role in [UserRole.SUPPORT_AGENT, UserRole.TEAM_LEAD] and ticket.status == TicketStatus.ASSIGNED:
        ticket.status = TicketStatus.IN_PROGRESS

    session.add(ticket)
    log_audit(session, ticket_id, "comment_added", current_user, f"Added {'internal ' if payload.is_internal else ''}comment")
    session.commit()
    session.refresh(comment)
    return comment

# Attachments
@router.get("/{ticket_id}/attachments", response_model=List[AttachmentOut])
def get_attachments(
    ticket_id: str,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    return session.exec(select(Attachment).where(Attachment.ticket_id == ticket_id)).all()

@router.post("/{ticket_id}/attachments", response_model=AttachmentOut)
async def upload_attachment(
    ticket_id: str,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to attach files to this ticket")

    orig_name = file.filename or "uploaded_file"
    safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', orig_name)
    unique_file_name = f"{uuid.uuid4().hex[:10]}_{safe_name}"
    file_path = os.path.join(UPLOAD_DIR, unique_file_name)

    # Read and save uploaded file to disk
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    now = get_now()
    attachment = Attachment(
        id=f"ATT-{uuid.uuid4().hex[:6]}",
        ticket_id=ticket_id,
        file_name=orig_name,
        file_url=f"/uploads/{unique_file_name}",
        uploaded_by_id=current_user.id,
        uploaded_by_name=current_user.name,
        created_at=now
    )
    session.add(attachment)
    mongo_insert_or_update("attachments", attachment.id, {
        "ticket_id": ticket_id,
        "file_name": orig_name,
        "file_url": f"/uploads/{unique_file_name}",
        "uploaded_by_id": current_user.id,
        "uploaded_by_name": current_user.name,
        "created_at": now.isoformat()
    })
    log_audit(session, ticket_id, "attachment_added", current_user, f"Uploaded file: {orig_name}")
    session.commit()
    session.refresh(attachment)
    return attachment
