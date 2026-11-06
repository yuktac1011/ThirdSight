import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.models import User, Role, Invitation, UserStatus
from app.core.dependencies import get_current_user_and_tenant, require_permission
from app.core.schemas import (
    UserResponse,
    UserCreate,
    UserUpdate,
    RoleResponse,
    InvitationCreate,
    InvitationResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_organization_users(
    current_user: User = Depends(require_permission("user:read")),
    db: Session = Depends(get_db)
):
    """
    List all users in the authenticated tenant's organization.
    Ensures zero cross-tenant visibility.
    """
    users = db.query(User).filter(User.organization_id == current_user.organization_id).all()
    return users


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_organization_user(
    payload: UserCreate,
    current_user: User = Depends(require_permission("user:create")),
    db: Session = Depends(get_db)
):
    """
    Create a new user directly in the caller's tenant organization.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    role = db.query(Role).filter(Role.name == payload.role).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role '{payload.role}' does not exist")

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        organization_id=current_user.organization_id,
        identity_subject=f"sub-{user_id[:8]}",
        email=payload.email,
        full_name=payload.full_name,
        status=UserStatus.ACTIVE,
        roles=[role]
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_organization_user(
    user_id: str,
    payload: UserUpdate,
    current_user: User = Depends(require_permission("user:update")),
    db: Session = Depends(get_db)
):
    """
    Update user status, name, or role within tenant boundaries.
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found in tenant organization")

    if payload.full_name is not None:
        user.full_name = payload.full_name

    if payload.status is not None:
        try:
            user.status = UserStatus(payload.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status value")

    if payload.role is not None:
        role = db.query(Role).filter(Role.name == payload.role).first()
        if not role:
            raise HTTPException(status_code=400, detail=f"Role '{payload.role}' not found")
        user.roles = [role]

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization_user(
    user_id: str,
    current_user: User = Depends(require_permission("user:delete")),
    db: Session = Depends(get_db)
):
    """
    Deactivate or remove user from organization.
    """
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrative account")

    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found in tenant organization")

    db.delete(user)
    db.commit()
    return None


@router.get("/roles/available", response_model=List[RoleResponse])
def get_available_roles(
    current_user: User = Depends(require_permission("user:read")),
    db: Session = Depends(get_db)
):
    roles = db.query(Role).all()
    return roles


# --- Invitations ---

@router.post("/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def invite_user(
    payload: InvitationCreate,
    current_user: User = Depends(require_permission("user:invite")),
    db: Session = Depends(get_db)
):
    """
    Generate an invitation link/token for onboarding a new member.
    """
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email is already registered")

    token = secrets.token_urlsafe(32)
    invitation = Invitation(
        organization_id=current_user.organization_id,
        email=payload.email,
        role_name=payload.role_name,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.get("/invitations", response_model=List[InvitationResponse])
def list_invitations(
    current_user: User = Depends(require_permission("user:read")),
    db: Session = Depends(get_db)
):
    invitations = db.query(Invitation).filter(
        Invitation.organization_id == current_user.organization_id,
        Invitation.is_accepted == False
    ).all()
    return invitations

