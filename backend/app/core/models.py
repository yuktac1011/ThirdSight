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
    Float,
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


# --- Questionnaire Enums ---

class TemplateStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class QuestionType(str, enum.Enum):
    YES_NO = "yes_no"
    YES_NO_NA = "yes_no_na"
    CHOICE_PARTIAL = "choice_partial"  # Yes / Partial / No / N/A
    TEXT = "text"


class SecurityDomain(str, enum.Enum):
    ACCESS_CONTROL = "Access Control & Identity"
    DATA_PROTECTION = "Data Protection & Cryptography"
    NETWORK_SECURITY = "Network Security & Architecture"
    INCIDENT_RESPONSE = "Incident Response & Resiliency"
    COMPLIANCE_AUDIT = "Regulatory Compliance & Audit"
    VULNERABILITY_MGMT = "Vulnerability & Patch Management"
    THIRD_PARTY_GOVERNANCE = "Third-Party & Supply Chain"
    PHYSICAL_ENVIRONMENTAL = "Physical & Environmental"


# --- Assessment Lifecycle Enums ---

class AssessmentStatus(str, enum.Enum):
    INITIATED = "initiated"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REOPENED = "reopened"


class AssignmentStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FLAGGED = "flagged"


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
    questionnaire_templates = relationship("QuestionnaireTemplate", back_populates="organization", cascade="all, delete-orphan")
    questionnaire_assignments = relationship("QuestionnaireAssignment", back_populates="organization", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="organization", cascade="all, delete-orphan")


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
    
    risk_score = Column(Integer, nullable=False, default=70)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="vendors")
    contacts = relationship("VendorContact", back_populates="vendor", cascade="all, delete-orphan")
    assignments = relationship("QuestionnaireAssignment", back_populates="vendor", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="vendor", cascade="all, delete-orphan")


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


# ================= QUESTIONNAIRE MODELS =================

class QuestionnaireTemplate(Base):
    __tablename__ = "questionnaire_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(Integer, nullable=False, default=1)
    status = Column(SQLEnum(TemplateStatus), nullable=False, default=TemplateStatus.DRAFT)
    framework_tag = Column(String(100), nullable=False, default="Custom SecOps")
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="questionnaire_templates")
    questions = relationship("Question", back_populates="template", cascade="all, delete-orphan", order_by="Question.order_index")
    assignments = relationship("QuestionnaireAssignment", back_populates="template", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="template", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String(36), ForeignKey("questionnaire_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)
    domain = Column(SQLEnum(SecurityDomain), nullable=False, default=SecurityDomain.ACCESS_CONTROL)
    text = Column(Text, nullable=False)
    guidance = Column(Text, nullable=True)
    question_type = Column(SQLEnum(QuestionType), nullable=False, default=QuestionType.CHOICE_PARTIAL)
    weight = Column(Float, nullable=False, default=1.0)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    requires_evidence = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    template = relationship("QuestionnaireTemplate", back_populates="questions")
    answers = relationship("QuestionAnswer", back_populates="question", cascade="all, delete-orphan")


class QuestionnaireAssignment(Base):
    __tablename__ = "questionnaire_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = Column(String(36), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(String(36), ForeignKey("questionnaire_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    template_version = Column(Integer, nullable=False)
    
    status = Column(SQLEnum(AssignmentStatus), nullable=False, default=AssignmentStatus.PENDING)
    due_date = Column(DateTime(timezone=True), nullable=True)
    assigned_to_email = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    completion_percentage = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="questionnaire_assignments")
    vendor = relationship("Vendor", back_populates="assignments")
    template = relationship("QuestionnaireTemplate", back_populates="assignments")
    answers = relationship("QuestionAnswer", back_populates="assignment", cascade="all, delete-orphan")


class QuestionAnswer(Base):
    __tablename__ = "question_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("questionnaire_assignments.id", ondelete="CASCADE"), nullable=True, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=True, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    response_value = Column(String(100), nullable=False)
    justification = Column(Text, nullable=True)
    evidence_reference = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    assignment = relationship("QuestionnaireAssignment", back_populates="answers")
    assessment = relationship("Assessment", back_populates="answers")
    question = relationship("Question", back_populates="answers")


# ================= ASSESSMENT LIFECYCLE MODELS =================

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = Column(String(36), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(String(36), ForeignKey("questionnaire_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    
    version = Column(Integer, nullable=False, default=1)
    status = Column(SQLEnum(AssessmentStatus), nullable=False, default=AssessmentStatus.INITIATED)
    scope = Column(String(255), nullable=False, default="Annual Vendor Risk Audit")
    due_at = Column(DateTime(timezone=True), nullable=True)
    assigned_respondent_email = Column(String(255), nullable=True)
    
    # Audit review fields
    analyst_reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    score = Column(Float, nullable=True) # Normalized computed score out of 100
    is_locked = Column(Boolean, default=False, nullable=False) # Locked on submit or approval
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="assessments")
    vendor = relationship("Vendor", back_populates="assessments")
    template = relationship("QuestionnaireTemplate", back_populates="assessments")
    reviewer = relationship("User", foreign_keys=[analyst_reviewer_id])
    answers = relationship("QuestionAnswer", back_populates="assessment", cascade="all, delete-orphan")
    history = relationship("AssessmentHistory", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentHistory.created_at.desc()")


class AssessmentHistory(Base):
    __tablename__ = "assessment_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    actor_email = Column(String(255), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    assessment = relationship("Assessment", back_populates="history")
