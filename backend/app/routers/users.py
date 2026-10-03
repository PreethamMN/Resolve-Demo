import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session, sync_to_mongodb
from app.models import User, UserRole
from app.schemas import UserOut, UserRegister, UserUpdate
from app.security import require_role, hash_password, oauth2_scheme, get_current_user_from_token

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[UserOut])
def get_users(
    role: str = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.TEAM_LEAD]))
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    return session.exec(query).all()

@router.get("/{user_id}", response_model=UserOut)
def get_user_by_id(
    user_id: str,
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    current_user = get_current_user_from_token(token, session)
    if current_user.role not in [UserRole.ADMIN, UserRole.TEAM_LEAD] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access user details")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("", response_model=UserOut)
def create_user(
    payload: UserRegister,
    session: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists")

    user_id = f"user_{uuid.uuid4().hex[:8]}"
    user = User(
        id=user_id,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    sync_to_mongodb()
    return user

@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.ADMIN, UserRole.TEAM_LEAD]))
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        user.email = payload.email
    if payload.role is not None:
        user.role = payload.role

    session.add(user)
    session.commit()
    session.refresh(user)
    sync_to_mongodb()
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    session: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    sync_to_mongodb()
    return {"message": "User deleted successfully"}
