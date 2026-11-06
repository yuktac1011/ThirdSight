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
    assignment_id: str
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
