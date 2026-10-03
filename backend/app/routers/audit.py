from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func

from app.database import get_session
from app.models import AuditLog, Ticket, TicketStatus, TicketCategory, User, UserRole
from app.schemas import AuditLogOut, SystemStats
from app.security import oauth2_scheme, get_current_user_from_token, require_role

router = APIRouter(prefix="/api", tags=["Audit Logs & System Stats"])

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    ticket_id: Optional[str] = None,
    session: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.ADMIN, UserRole.TEAM_LEAD]))
):
    query = select(AuditLog)
    if ticket_id:
        query = query.where(AuditLog.ticket_id == ticket_id)
    return session.exec(query.order_by(AuditLog.created_at.desc())).all()

@router.get("/tickets/{ticket_id}/audit-logs", response_model=List[AuditLogOut])
def get_ticket_audit_logs(
    ticket_id: str,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    return session.exec(select(AuditLog).where(AuditLog.ticket_id == ticket_id).order_by(AuditLog.created_at.desc())).all()

@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    tickets = session.exec(select(Ticket)).all()
    users = session.exec(select(User)).all()

    total_tickets = len(tickets)
    new_tickets = sum(1 for t in tickets if t.status == TicketStatus.NEW)
    assigned_tickets = sum(1 for t in tickets if t.status == TicketStatus.ASSIGNED)
    in_progress_tickets = sum(1 for t in tickets if t.status == TicketStatus.IN_PROGRESS)
    on_hold_tickets = sum(1 for t in tickets if t.status == TicketStatus.ON_HOLD)
    resolved_tickets = sum(1 for t in tickets if t.status == TicketStatus.RESOLVED)
    closed_tickets = sum(1 for t in tickets if t.status == TicketStatus.CLOSED)

    tickets_by_cat = {}
    for cat in TicketCategory:
        tickets_by_cat[cat.value] = sum(1 for t in tickets if t.category == cat)

    agents = [u for u in users if u.role in [UserRole.SUPPORT_AGENT, UserRole.TEAM_LEAD]]
    tickets_by_agent = {}
    for a in agents:
        tickets_by_agent[a.name] = sum(1 for t in tickets if t.assigned_agent_id == a.id)

    total_customers = sum(1 for u in users if u.role == UserRole.CUSTOMER)
    total_agents = len(agents)

    return SystemStats(
        total_tickets=total_tickets,
        new_tickets=new_tickets,
        assigned_tickets=assigned_tickets,
        in_progress_tickets=in_progress_tickets,
        on_hold_tickets=on_hold_tickets,
        resolved_tickets=resolved_tickets,
        closed_tickets=closed_tickets,
        tickets_by_category=tickets_by_cat,
        tickets_by_agent=tickets_by_agent,
        total_customers=total_customers,
        total_agents=total_agents
    )
