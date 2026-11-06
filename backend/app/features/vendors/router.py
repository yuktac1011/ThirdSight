import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.models import (
    Vendor,
    VendorContact,
    VendorCriticality,
    VendorStatus,
    DataClassification,
    AccessLevel,
    User,
)
from app.core.dependencies import get_current_user_and_tenant, require_permission
from app.core.schemas import (
    VendorCreate,
    VendorUpdate,
    VendorResponse,
    VendorContactCreate,
    VendorContactResponse,
)

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get("", response_model=List[VendorResponse])
def list_vendors(
    search: Optional[str] = Query(None, description="Search by name, industry, or service category"),
    criticality: Optional[str] = Query(None, description="Filter by criticality tier (tier_1, tier_2, tier_3)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by vendor lifecycle status"),
    current_user: User = Depends(require_permission("vendor:read")),
    db: Session = Depends(get_db),
):
    """
    List all vendors within the authenticated tenant's organization boundary.
    Guarantees strict tenant isolation.
    """
    query = db.query(Vendor).filter(Vendor.organization_id == current_user.organization_id)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Vendor.name.ilike(search_fmt),
                Vendor.industry.ilike(search_fmt),
                Vendor.service_category.ilike(search_fmt),
                Vendor.website.ilike(search_fmt),
            )
        )

    if criticality:
        try:
            crit_enum = VendorCriticality(criticality)
            query = query.filter(Vendor.criticality == crit_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid criticality tier: {criticality}")

    if status_filter:
        try:
            status_enum = VendorStatus(status_filter)
            query = query.filter(Vendor.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid vendor status: {status_filter}")

    vendors = query.order_by(Vendor.created_at.desc()).all()
    return vendors


@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    payload: VendorCreate,
    current_user: User = Depends(require_permission("vendor:write")),
    db: Session = Depends(get_db),
):
    """
    Register a new third-party vendor inside the caller's tenant organization.
    Checks for duplicate vendor names within the tenant boundary.
    """
    # Enforce tenant-scoped uniqueness
    existing = (
        db.query(Vendor)
        .filter(
            Vendor.organization_id == current_user.organization_id,
            Vendor.name.ilike(payload.name.strip()),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vendor with name '{payload.name}' already registered in your organization",
        )

    try:
        criticality_enum = VendorCriticality(payload.criticality)
        status_enum = VendorStatus(payload.status)
        data_class_enum = DataClassification(payload.data_classification)
        access_level_enum = AccessLevel(payload.access_level)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    vendor_id = str(uuid.uuid4())
    vendor = Vendor(
        id=vendor_id,
        organization_id=current_user.organization_id,
        name=payload.name.strip(),
        website=payload.website,
        industry=payload.industry,
        service_category=payload.service_category,
        service_description=payload.service_description,
        criticality=criticality_enum,
        status=status_enum,
        data_classification=data_class_enum,
        access_level=access_level_enum,
        risk_score=75 if criticality_enum == VendorCriticality.TIER_1 else 82,
    )
    db.add(vendor)
    db.flush()

    # Add initial contacts if provided
    if payload.contacts:
        for idx, c in enumerate(payload.contacts):
            contact = VendorContact(
                id=str(uuid.uuid4()),
                vendor_id=vendor.id,
                name=c.name.strip(),
                email=c.email.lower().strip(),
                phone=c.phone,
                title=c.title,
                is_primary=c.is_primary or (idx == 0),
            )
            db.add(contact)

    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(
    vendor_id: str,
    current_user: User = Depends(require_permission("vendor:read")),
    db: Session = Depends(get_db),
):
    """
    Retrieve single vendor profile by ID.
    Enforces strict IDOR protection: cannot access vendors of other tenants.
    """
    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == vendor_id,
            Vendor.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found in organization")
    return vendor


@router.patch("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: str,
    payload: VendorUpdate,
    current_user: User = Depends(require_permission("vendor:write")),
    db: Session = Depends(get_db),
):
    """
    Update vendor attributes and classification.
    """
    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == vendor_id,
            Vendor.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found in organization")

    if payload.name is not None and payload.name.strip() != vendor.name:
        # Check duplicate
        duplicate = (
            db.query(Vendor)
            .filter(
                Vendor.organization_id == current_user.organization_id,
                Vendor.name.ilike(payload.name.strip()),
                Vendor.id != vendor.id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Vendor name already taken by another registered vendor")
        vendor.name = payload.name.strip()

    if payload.website is not None:
        vendor.website = payload.website
    if payload.industry is not None:
        vendor.industry = payload.industry
    if payload.service_category is not None:
        vendor.service_category = payload.service_category
    if payload.service_description is not None:
        vendor.service_description = payload.service_description

    if payload.criticality is not None:
        try:
            vendor.criticality = VendorCriticality(payload.criticality)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid criticality")

    if payload.status is not None:
        try:
            vendor.status = VendorStatus(payload.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

    if payload.data_classification is not None:
        try:
            vendor.data_classification = DataClassification(payload.data_classification)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid data classification")

    if payload.access_level is not None:
        try:
            vendor.access_level = AccessLevel(payload.access_level)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid access level")

    if payload.risk_score is not None:
        vendor.risk_score = payload.risk_score

    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    vendor_id: str,
    current_user: User = Depends(require_permission("vendor:write")),
    db: Session = Depends(get_db),
):
    """
    Remove or decommission vendor from current tenant.
    """
    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == vendor_id,
            Vendor.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found in organization")

    db.delete(vendor)
    db.commit()
    return None


# --- Vendor Contacts ---

@router.post("/{vendor_id}/contacts", response_model=VendorContactResponse, status_code=status.HTTP_201_CREATED)
def add_vendor_contact(
    vendor_id: str,
    payload: VendorContactCreate,
    current_user: User = Depends(require_permission("vendor:write")),
    db: Session = Depends(get_db),
):
    """
    Add contact representative to a vendor.
    """
    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == vendor_id,
            Vendor.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found in organization")

    contact = VendorContact(
        id=str(uuid.uuid4()),
        vendor_id=vendor.id,
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone,
        title=payload.title,
        is_primary=payload.is_primary,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{vendor_id}/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_vendor_contact(
    vendor_id: str,
    contact_id: str,
    current_user: User = Depends(require_permission("vendor:write")),
    db: Session = Depends(get_db),
):
    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == vendor_id,
            Vendor.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found in organization")

    contact = db.query(VendorContact).filter(
        VendorContact.id == contact_id,
        VendorContact.vendor_id == vendor.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found for this vendor")

    db.delete(contact)
    db.commit()
    return None

