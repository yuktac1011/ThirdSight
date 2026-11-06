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
