import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Boolean,
    Table,
    Integer,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class OrganizationStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INVITED = "invited"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class RoleType(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    AUDITOR = "auditor"
    VENDOR_USER = "vendor_user"


class VendorCriticality(str, enum.Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"


class VendorStatus(str, enum.Enum):
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    MONITORED = "monitored"
    DECOMMISSIONED = "decommissioned"


class DataClassification(str, enum.Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class AccessLevel(str, enum.Enum):
    NONE = "none"
    NETWORK = "network"
    APPLICATION = "application"
    DATABASE = "database"
    ADMINISTRATIVE = "administrative"


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    status = Column(SQLEnum(OrganizationStatus), nullable=False, default=OrganizationStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="organization", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="organization", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)


class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    permissions = relationship("Permission", secondary=role_permissions, backref="roles")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    identity_subject = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    status = Column(SQLEnum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    is_mfa_enabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="users")
    roles = relationship("Role", secondary=user_roles, backref="users")


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    role_name = Column(String(50), nullable=False, default="analyst")
    token = Column(String(255), unique=True, nullable=False, index=True)
    is_accepted = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="invitations")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    website = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=False, default="Technology")
    service_category = Column(String(100), nullable=False, default="Software / SaaS")
    service_description = Column(Text, nullable=True)
    
    criticality = Column(SQLEnum(VendorCriticality), nullable=False, default=VendorCriticality.TIER_2)
    status = Column(SQLEnum(VendorStatus), nullable=False, default=VendorStatus.UNDER_REVIEW)
    data_classification = Column(SQLEnum(DataClassification), nullable=False, default=DataClassification.CONFIDENTIAL)
    access_level = Column(SQLEnum(AccessLevel), nullable=False, default=AccessLevel.APPLICATION)
    
    risk_score = Column(Integer, nullable=False, default=70) # Baseline normalized posture score
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="vendors")
    contacts = relationship("VendorContact", back_populates="vendor", cascade="all, delete-orphan")


class VendorContact(Base):
    __tablename__ = "vendor_contacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String(36), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    title = Column(String(100), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    vendor = relationship("Vendor", back_populates="contacts")
