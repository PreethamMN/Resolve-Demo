import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Order, User, UserRole
from app.schemas import OrderOut, OrderItem
from app.security import oauth2_scheme, get_current_user_from_token, require_role

router = APIRouter(prefix="/api", tags=["Orders"])

def format_order(order: Order) -> OrderOut:
    items_raw = json.loads(order.items_json) if order.items_json else []
    items = [OrderItem(**item) for item in items_raw]
    return OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        items=items,
        total_amount=order.total_amount,
        payment_status=order.payment_status,
        delivery_status=order.delivery_status,
        order_date=order.order_date
    )

@router.get("/orders", response_model=List[OrderOut])
def list_orders(
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    if current_user.role == UserRole.CUSTOMER:
        orders = session.exec(select(Order).where(Order.customer_id == current_user.id)).all()
    else:
        orders = session.exec(select(Order)).all()
    return [format_order(o) for o in orders]

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(
    order_id: str,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == UserRole.CUSTOMER and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    return format_order(order)

@router.get("/customers/me/orders", response_model=List[OrderOut])
def get_my_orders(
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    orders = session.exec(select(Order).where(Order.customer_id == current_user.id)).all()
    return [format_order(o) for o in orders]
