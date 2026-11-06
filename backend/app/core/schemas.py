from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    email: EmailStr
    identity_subject: Optional[str] = None


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=50)


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    status: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    created_at: datetime
    updated_at: datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    role: str = "analyst"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    status: Optional[str] = None
    role: Optional[str] = None


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    status: str
    roles: List[RoleResponse] = []
    created_at: datetime


class CurrentUserProfile(UserResponse):
    permissions: List[str] = []
    organization_name: str
    organization_slug: str


class InvitationCreate(BaseModel):
    email: EmailStr
    role_name: str = "analyst"


class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    email: str
    role_name: str
    token: str
    is_accepted: bool
    expires_at: datetime
    created_at: datetime


# ================= VENDOR SCHEMAS =================

class VendorContactBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=100)
    is_primary: bool = False


class VendorContactCreate(VendorContactBase):
    pass


class VendorContactResponse(VendorContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    vendor_id: str
    created_at: datetime


class VendorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    website: Optional[str] = Field(None, max_length=255)
    industry: str = Field("Technology", min_length=2, max_length=100)
    service_category: str = Field("Software / SaaS", min_length=2, max_length=100)
    service_description: Optional[str] = None
    criticality: str = Field("tier_2", description="tier_1, tier_2, tier_3")
    status: str = Field("under_review", description="active, under_review, monitored, decommissioned")
    data_classification: str = Field("confidential", description="public, internal, confidential, restricted")
    access_level: str = Field("application", description="none, network, application, database, administrative")


class VendorCreate(VendorBase):
    contacts: Optional[List[VendorContactCreate]] = []


class VendorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    website: Optional[str] = None
    industry: Optional[str] = None
    service_category: Optional[str] = None
    service_description: Optional[str] = None
    criticality: Optional[str] = None
    status: Optional[str] = None
    data_classification: Optional[str] = None
    access_level: Optional[str] = None
    risk_score: Optional[int] = Field(None, ge=0, le=100)


class VendorResponse(VendorBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    risk_score: int
    created_at: datetime
    updated_at: datetime
    contacts: List[VendorContactResponse] = []


# ================= QUESTIONNAIRE SCHEMAS =================

class QuestionBase(BaseModel):
    order_index: int = 0
    domain: str = Field("Access Control & Identity")
    text: str = Field(..., min_length=5)
    guidance: Optional[str] = None
    question_type: str = Field("choice_partial", description="yes_no, yes_no_na, choice_partial, text")
    weight: float = Field(1.0, ge=0.1, le=10.0)
    is_mandatory: bool = True
    requires_evidence: bool = False


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    order_index: Optional[int] = None
    domain: Optional[str] = None
    text: Optional[str] = Field(None, min_length=5)
    guidance: Optional[str] = None
    question_type: Optional[str] = None
    weight: Optional[float] = Field(None, ge=0.1, le=10.0)
    is_mandatory: Optional[bool] = None
    requires_evidence: Optional[bool] = None


class QuestionResponse(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    template_id: str
    created_at: datetime


class QuestionnaireTemplateBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    framework_tag: str = Field("Custom SecOps", max_length=100)
    status: str = Field("draft", description="draft, published, archived")


class QuestionnaireTemplateCreate(QuestionnaireTemplateBase):
    questions: Optional[List[QuestionCreate]] = []


class QuestionnaireTemplateUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    framework_tag: Optional[str] = None
    status: Optional[str] = None


class QuestionnaireTemplateResponse(QuestionnaireTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    version: int
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionResponse] = []


class QuestionnaireAssignmentCreate(BaseModel):
    vendor_id: str
    template_id: str
    due_date: Optional[datetime] = None
    assigned_to_email: Optional[EmailStr] = None
    notes: Optional[str] = None


class AnswerSubmission(BaseModel):
    question_id: str
    response_value: str
    justification: Optional[str] = None
    evidence_reference: Optional[str] = None


class AnswerResponse(AnswerSubmission):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assignment_id: Optional[str] = None
    assessment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class QuestionnaireAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    vendor_id: str
    template_id: str
    template_version: int
    status: str
    due_date: Optional[datetime] = None
    assigned_to_email: Optional[str] = None
    notes: Optional[str] = None
    completion_percentage: int
    created_at: datetime
    updated_at: datetime
    vendor_name: Optional[str] = None
    template_title: Optional[str] = None
    answers: List[AnswerResponse] = []


# ================= ASSESSMENT LIFECYCLE SCHEMAS =================

class AssessmentCreate(BaseModel):
    vendor_id: str
    template_id: str
    scope: str = Field("Annual Vendor Risk Audit", min_length=3, max_length=255)
    due_at: Optional[datetime] = None
    assigned_respondent_email: Optional[EmailStr] = None


class AssessmentReviewAction(BaseModel):
    action: str = Field(..., description="approve, reject, reopen")
    review_notes: Optional[str] = None


class AssessmentHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    from_status: Optional[str] = None
    to_status: str
    actor_email: str
    comment: Optional[str] = None
    created_at: datetime


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    vendor_id: str
    template_id: str
    version: int
    status: str
    scope: str
    due_at: Optional[datetime] = None
    assigned_respondent_email: Optional[str] = None
    analyst_reviewer_id: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    score: Optional[float] = None
    is_locked: bool
    created_at: datetime
    updated_at: datetime
    vendor_name: Optional[str] = None
    template_title: Optional[str] = None
    completion_percentage: int = 0
    answers: List[AnswerResponse] = []
    history: List[AssessmentHistoryResponse] = []


# ================= EVIDENCE & DOCUMENT SCHEMAS =================

class EvidenceReviewRequest(BaseModel):
    action: str = Field(..., description="approve or reject")
    rejection_reason: Optional[str] = None
    rejection_comment: Optional[str] = None


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    vendor_id: str
    assessment_id: Optional[str] = None
    question_id: Optional[str] = None
    file_name: str
    file_size: int
    mime_type: str
    sha256_hash: str
    storage_key: str
    status: str
    scan_result: Optional[str] = None
    extracted_text_preview: Optional[str] = None
    rejection_reason: Optional[str] = None
    rejection_comment: Optional[str] = None
    reviewer_email: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    vendor_name: Optional[str] = None


# ================= SECURITY CONTROLS & FRAMEWORKS SCHEMAS =================

class FrameworkBase(BaseModel):
    name: str
    version: str
    description: Optional[str] = None


class FrameworkResponse(FrameworkBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


class ControlMappingBase(BaseModel):
    framework_id: str
    framework_ref: str
    mapping_notes: Optional[str] = None


class ControlMappingResponse(ControlMappingBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    control_id: str
    framework_name: Optional[str] = None
    framework_version: Optional[str] = None


class SecurityControlBase(BaseModel):
    code: str
    domain: str
    title: str
    description: str
    guidance: Optional[str] = None
    version: int = 1


class SecurityControlCreate(SecurityControlBase):
    framework_mappings: Optional[List[ControlMappingBase]] = []


class SecurityControlResponse(SecurityControlBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    mappings: List[ControlMappingResponse] = []


class ControlAssessmentEvaluateRequest(BaseModel):
    effectiveness: str = Field(..., description="effective, partially_effective, ineffective, not_applicable")
    rationale: Optional[str] = None
    evidence_ids: Optional[List[str]] = []


class ControlAssessmentResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_id: str
    control_id: str
    control_code: Optional[str] = None
    control_title: Optional[str] = None
    control_domain: Optional[str] = None
    effectiveness: str
    rationale: Optional[str] = None
    evaluator_email: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    associated_evidence_ids: List[str] = []


class FrameworkCoverageMetric(BaseModel):
    framework_name: str
    framework_version: str
    total_controls: int
    evaluated_controls: int
    effective_controls: int
    partially_effective_controls: int
    ineffective_controls: int
    coverage_percentage: int


# ================= RISK ENGINE & REMEDIATION SCHEMAS =================

class RiskScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_id: str
    organization_id: str
    methodology_version: str
    likelihood: int
    impact: int
    inherent_score: int
    inherent_band: str
    control_effectiveness_score: float
    residual_score: int
    residual_band: str
    explanation: Optional[str] = None
    calculated_at: datetime


class FindingBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str
    severity: str = Field("medium", description="low, medium, high, critical")


class FindingCreate(FindingBase):
    control_id: Optional[str] = None


class RemediationCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    action_plan: str
    owner_email: EmailStr
    due_date: datetime


class RemediationUpdate(BaseModel):
    status: str = Field(..., description="planned, in_progress, completed, overdue")
    action_plan: Optional[str] = None


class RemediationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    finding_id: str
    title: str
    action_plan: str
    owner_email: str
    due_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime


class RiskAcceptanceRequest(BaseModel):
    rationale: str = Field(..., min_length=10)
    compensating_controls: Optional[str] = None
    expires_at: datetime


class RiskAcceptanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    finding_id: str
    approver_email: str
    rationale: str
    compensating_controls: Optional[str] = None
    expires_at: datetime
    created_at: datetime


class FindingResponse(FindingBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_id: str
    organization_id: str
    control_id: Optional[str] = None
    control_code: Optional[str] = None
    status: str
    identified_at: datetime
    closed_at: Optional[datetime] = None
    remediations: List[RemediationResponse] = []
    risk_acceptance: Optional[RiskAcceptanceResponse] = None


# ================= AI EVIDENCE INTELLIGENCE SCHEMAS =================

class AISuggestedMapping(BaseModel):
    control_code: str
    control_title: str
    relevance_score: float # 0.0 to 1.0
    citation: str
    page_reference: Optional[str] = None
    rationale: str


class AIClaimDiscrepancy(BaseModel):
    vendor_claim: str
    evidence_fact: str
    discrepancy_level: str # aligned, partial_conflict, direct_contradiction
    analysis: str


class AIEvidenceInsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_id: str
    summary: str
    confidence_score: float
    suggested_mappings: List[AISuggestedMapping] = []
    discrepancies: List[AIClaimDiscrepancy] = []
    decision: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class AIInsightReviewRequest(BaseModel):
    decision: str = Field(..., description="approve or reject")
    selected_control_codes: Optional[List[str]] = [] # Approved control codes to link evidence to


# ================= REPORTING, NOTIFICATIONS & AUDIT SCHEMAS =================

class ReportGenerateRequest(BaseModel):
    assessment_id: str
    report_type: str = Field("executive", description="executive or technical")


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_id: str
    organization_id: str
    report_type: str
    title: str
    version: int
    storage_key: str
    sha256_hash: str
    file_size: int
    generated_by: str
    generated_at: datetime


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recipient_email: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    actor_email: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime



