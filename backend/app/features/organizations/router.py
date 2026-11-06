import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.models import Organization, OrganizationStatus, User
from app.core.dependencies import get_current_user_and_tenant, require_permission
from app.core.schemas import OrganizationResponse, OrganizationCreate, OrganizationUpdate

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("/current", response_model=OrganizationResponse)
def get_current_organization(
    current_user: User = Depends(get_current_user_and_tenant),
    db: Session = Depends(get_db)
):
    """
    Retrieve current tenant organization for the authenticated principal.
    Enforces strict tenant isolation (no cross-tenant leakage).
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/current", response_model=OrganizationResponse)
def update_current_organization(
    payload: OrganizationUpdate,
    current_user: User = Depends(require_permission("org:update")),
    db: Session = Depends(get_db)
):
    """
    Update tenant organization properties (requires org:update permission).
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if payload.name:
        org.name = payload.name
    if payload.status:
        try:
            org.status = OrganizationStatus(payload.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid organization status")

    db.commit()
    db.refresh(org)
    return org


@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization_by_id(
    organization_id: str,
    current_user: User = Depends(get_current_user_and_tenant),
    db: Session = Depends(get_db)
):
    """
    Get organization details with strict cross-tenant protection:
    A user cannot read an organization other than their own.
    """
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-tenant access forbidden"
        )

    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

