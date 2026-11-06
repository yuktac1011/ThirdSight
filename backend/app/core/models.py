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


# --- Evidence Enums ---

class EvidenceStatus(str, enum.Enum):
    QUARANTINED = "quarantined"
    SCANNING = "scanning"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class RejectionReason(str, enum.Enum):
    MALICIOUS_PAYLOAD = "malicious_payload"
    MIME_MISMATCH = "mime_mismatch"
    EXPIRED_CERTIFICATE = "expired_certificate"
    INSUFFICIENT_DETAIL = "insufficient_detail"
    UNAUTHORIZED_SCOPE = "unauthorized_scope"
    TAMPERED_OR_CORRUPT = "tampered_or_corrupt"
    OTHER = "other"


# --- Security Control Enums ---

class ControlEffectiveness(str, enum.Enum):
    EFFECTIVE = "effective"
    PARTIALLY_EFFECTIVE = "partially_effective"
    INEFFECTIVE = "ineffective"
    NOT_APPLICABLE = "not_applicable"
    UNASSESSED = "unassessed"


# --- Risk & Finding Enums ---

class RiskBand(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FindingSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    IN_REMEDIATION = "in_remediation"
    ACCEPTED = "accepted"
    RESOLVED = "resolved"


class RemediationStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class AIInsightDecision(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"




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


# ================= EVIDENCE & DOCUMENT MANAGEMENT =================

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = Column(String(36), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="SET NULL"), nullable=True, index=True)

    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False) # In bytes
    mime_type = Column(String(100), nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)
    storage_key = Column(String(255), nullable=False, unique=True)
    status = Column(SQLEnum(EvidenceStatus), nullable=False, default=EvidenceStatus.QUARANTINED)

    # Security verification & scanning
    scan_result = Column(String(255), nullable=True) # e.g. "Clean - signature OK", "Heuristic match"
    extracted_text_preview = Column(Text, nullable=True)
    rejection_reason = Column(SQLEnum(RejectionReason), nullable=True)
    rejection_comment = Column(Text, nullable=True)
    reviewer_email = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization")
    vendor = relationship("Vendor")
    assessment = relationship("Assessment")
    question = relationship("Question")
    control_associations = relationship("ControlEvidenceAssociation", back_populates="evidence", cascade="all, delete-orphan")


# ================= SECURITY CONTROLS & FRAMEWORKS =================

class Framework(Base):
    __tablename__ = "frameworks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True, index=True)
    version = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    mappings = relationship("ControlFrameworkMapping", back_populates="framework", cascade="all, delete-orphan")


class SecurityControl(Base):
    __tablename__ = "security_controls"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), nullable=False, unique=True, index=True)
    domain = Column(SQLEnum(SecurityDomain), nullable=False, default=SecurityDomain.ACCESS_CONTROL)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    guidance = Column(Text, nullable=True)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    mappings = relationship("ControlFrameworkMapping", back_populates="control", cascade="all, delete-orphan")
    assessment_results = relationship("ControlAssessmentResult", back_populates="control", cascade="all, delete-orphan")


class ControlFrameworkMapping(Base):
    __tablename__ = "control_framework_mappings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    control_id = Column(String(36), ForeignKey("security_controls.id", ondelete="CASCADE"), nullable=False, index=True)
    framework_id = Column(String(36), ForeignKey("frameworks.id", ondelete="CASCADE"), nullable=False, index=True)
    framework_ref = Column(String(100), nullable=False) # e.g. "PR.AC-1", "A.5.15", "CC6.1"
    mapping_notes = Column(Text, nullable=True)

    control = relationship("SecurityControl", back_populates="mappings")
    framework = relationship("Framework", back_populates="mappings")


class ControlAssessmentResult(Base):
    __tablename__ = "control_assessment_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    control_id = Column(String(36), ForeignKey("security_controls.id", ondelete="CASCADE"), nullable=False, index=True)
    
    effectiveness = Column(SQLEnum(ControlEffectiveness), nullable=False, default=ControlEffectiveness.UNASSESSED)
    rationale = Column(Text, nullable=True)
    evaluator_email = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    assessment = relationship("Assessment")
    control = relationship("SecurityControl", back_populates="assessment_results")
    evidence_associations = relationship("ControlEvidenceAssociation", back_populates="control_result", cascade="all, delete-orphan")


class ControlEvidenceAssociation(Base):
    __tablename__ = "control_evidence_associations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    control_result_id = Column(String(36), ForeignKey("control_assessment_results.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(String(255), nullable=True)
    associated_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    control_result = relationship("ControlAssessmentResult", back_populates="evidence_associations")
    evidence = relationship("Evidence", back_populates="control_associations")


# ================= RISK ENGINE & REMEDIATION MODELS =================

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    methodology_version = Column(String(50), nullable=False, default="v1.0-standard")

    likelihood = Column(Integer, nullable=False) # 1 to 5
    impact = Column(Integer, nullable=False)     # 1 to 5
    inherent_score = Column(Integer, nullable=False) # 1 to 25
    inherent_band = Column(SQLEnum(RiskBand), nullable=False)

    control_effectiveness_score = Column(Float, nullable=False) # 0.0 to 1.0
    residual_score = Column(Integer, nullable=False) # 1 to 25
    residual_band = Column(SQLEnum(RiskBand), nullable=False)

    explanation = Column(Text, nullable=True)
    calculated_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    assessment = relationship("Assessment")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    control_id = Column(String(36), ForeignKey("security_controls.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(SQLEnum(FindingSeverity), nullable=False, default=FindingSeverity.MEDIUM)
    status = Column(SQLEnum(FindingStatus), nullable=False, default=FindingStatus.OPEN)

    identified_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    control = relationship("SecurityControl")
    assessment = relationship("Assessment")
    remediations = relationship("Remediation", back_populates="finding", cascade="all, delete-orphan")
    risk_acceptance = relationship("RiskAcceptance", back_populates="finding", uselist=False, cascade="all, delete-orphan")


class Remediation(Base):
    __tablename__ = "remediations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    finding_id = Column(String(36), ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    action_plan = Column(Text, nullable=False)
    owner_email = Column(String(255), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(RemediationStatus), nullable=False, default=RemediationStatus.PLANNED)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    finding = relationship("Finding", back_populates="remediations")


class RiskAcceptance(Base):
    __tablename__ = "risk_acceptances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    finding_id = Column(String(36), ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    approver_email = Column(String(255), nullable=False)
    rationale = Column(Text, nullable=False)
    compensating_controls = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    finding = relationship("Finding", back_populates="risk_acceptance")


# ================= AI EVIDENCE INTELLIGENCE MODELS =================

class AIEvidenceInsight(Base):
    __tablename__ = "ai_evidence_insights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    summary = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.85)
    suggested_mappings_json = Column(Text, nullable=False) # JSON serialized list of suggested control mappings
    claims_comparison_json = Column(Text, nullable=True)   # JSON serialized comparison of claims vs evidence
    prompt_sanitization_log = Column(String(255), nullable=True)

    decision = Column(SQLEnum(AIInsightDecision), nullable=False, default=AIInsightDecision.PENDING)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    evidence = relationship("Evidence")


