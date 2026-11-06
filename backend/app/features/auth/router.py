import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.models import User, Organization, Role, UserStatus, OrganizationStatus
from app.core.security import create_access_token
from app.core.config import settings
from app.core.dependencies import get_current_user_and_tenant
from app.core.schemas import TokenResponse, LoginRequest, CurrentUserProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Direct login / token issuance for development and identity federation verification.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or unknown user"
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.status.value}"
        )

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org or org.status != OrganizationStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User organization is suspended or inactive"
        )

    access_token = create_access_token(
        data={
            "sub": user.id,
            "org_id": user.organization_id,
            "email": user.email,
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=CurrentUserProfile)
def get_current_user_profile(
    current_user: User = Depends(get_current_user_and_tenant),
    db: Session = Depends(get_db)
):
    """
    Retrieve authenticated user identity, role, permissions and organization tenant details.
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    org_name = org.name if org else "Unknown Organization"
    org_slug = org.slug if org else "unknown"

    permissions = set()
    for role in current_user.roles:
        for p in role.permissions:
            permissions.add(p.code)

    return CurrentUserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        organization_id=current_user.organization_id,
        status=current_user.status.value,
        roles=[{"id": r.id, "name": r.name, "description": r.description} for r in current_user.roles],
        permissions=sorted(list(permissions)),
        organization_name=org_name,
        organization_slug=org_slug,
        created_at=current_user.created_at,
    )


@router.post("/oidc/callback", response_model=TokenResponse)
def oidc_callback(payload: dict, db: Session = Depends(get_db)):
    """
    Simulated or real OIDC callback endpoint for token exchange and JIT user provisioning.
    """
    email = payload.get("email")
    sub = payload.get("sub")
    org_slug = payload.get("org_slug", "default-org")

    if not email or not sub:
        raise HTTPException(status_code=400, detail="Missing required OIDC claims")

    user = db.query(User).filter((User.email == email) | (User.identity_subject == sub)).first()

    if not user:
        # Check or create default organization
        org = db.query(Organization).filter(Organization.slug == org_slug).first()
        if not org:
            org = Organization(
                name="Default Enterprise",
                slug=org_slug,
                status=OrganizationStatus.ACTIVE
            )
            db.add(org)
            db.flush()

        role = db.query(Role).filter(Role.name == "analyst").first()
        user = User(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            identity_subject=sub,
            email=email,
            full_name=payload.get("name", email.split("@")[0]),
            status=UserStatus.ACTIVE,
            roles=[role] if role else []
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(
        data={"sub": user.id, "org_id": user.organization_id, "email": user.email}
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

