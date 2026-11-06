export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AssessmentStatus = 'completed' | 'in_progress' | 'pending' | 'flagged';

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  status: 'active' | 'invited' | 'suspended' | 'deactivated';
  roles: UserRole[];
  permissions: string[];
  created_at: string;
}

export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string;
  status: 'active' | 'invited' | 'suspended' | 'deactivated';
  roles: UserRole[];
  created_at: string;
}

export interface UserInvitation {
  id: string;
  organization_id: string;
  email: string;
  role_name: string;
  token: string;
  is_accepted: boolean;
  expires_at: string;
  created_at: string;
}

// ================= VENDOR TYPES =================

export type VendorCriticalityType = 'tier_1' | 'tier_2' | 'tier_3';

export type VendorStatusType = 'active' | 'under_review' | 'monitored' | 'decommissioned';

export type DataClassificationType = 'public' | 'internal' | 'confidential' | 'restricted';

export type AccessLevelType = 'none' | 'network' | 'application' | 'database' | 'administrative';

export interface VendorContact {
  id: string;
  vendor_id: string;
  name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface VendorEntity {
  id: string;
  organization_id: string;
  name: string;
  website?: string | null;
  industry: string;
  service_category: string;
  service_description?: string | null;
  criticality: VendorCriticalityType;
  status: VendorStatusType;
  data_classification: DataClassificationType;
  access_level: AccessLevelType;
  risk_score: number;
  created_at: string;
  updated_at: string;
  contacts: VendorContact[];
}

export interface VendorCreatePayload {
  name: string;
  website?: string;
  industry: string;
  service_category: string;
  service_description?: string;
  criticality: VendorCriticalityType;
  status: VendorStatusType;
  data_classification: DataClassificationType;
  access_level: AccessLevelType;
  contacts?: {
    name: string;
    email: string;
    phone?: string;
    title?: string;
    is_primary?: boolean;
  }[];
}

export interface VendorUpdatePayload {
  name?: string;
  website?: string;
  industry?: string;
  service_category?: string;
  service_description?: string;
  criticality?: VendorCriticalityType;
  status?: VendorStatusType;
  data_classification?: DataClassificationType;
  access_level?: AccessLevelType;
  risk_score?: number;
}

// ================= QUESTIONNAIRE TYPES =================

export type TemplateStatusType = 'draft' | 'published' | 'archived';

export type QuestionTypeValue = 'yes_no' | 'yes_no_na' | 'choice_partial' | 'text';

export type SecurityDomainType =
  | 'Access Control & Identity'
  | 'Data Protection & Cryptography'
  | 'Network Security & Architecture'
  | 'Incident Response & Resiliency'
  | 'Regulatory Compliance & Audit'
  | 'Vulnerability & Patch Management'
  | 'Third-Party & Supply Chain'
  | 'Physical & Environmental';

export type AssignmentStatusType = 'pending' | 'in_progress' | 'completed' | 'flagged';

export interface QuestionEntity {
  id: string;
  template_id: string;
  order_index: number;
  domain: SecurityDomainType;
  text: string;
  guidance?: string | null;
  question_type: QuestionTypeValue;
  weight: number;
  is_mandatory: boolean;
  requires_evidence: boolean;
  created_at: string;
}

export interface QuestionnaireTemplateEntity {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  framework_tag: string;
  status: TemplateStatusType;
  version: number;
  created_at: string;
  updated_at: string;
  questions: QuestionEntity[];
}

export interface QuestionnaireTemplateCreatePayload {
  title: string;
  description?: string;
  framework_tag?: string;
  status?: TemplateStatusType;
  questions?: {
    order_index?: number;
    domain: SecurityDomainType;
    text: string;
    guidance?: string;
    question_type: QuestionTypeValue;
    weight?: number;
    is_mandatory?: boolean;
    requires_evidence?: boolean;
  }[];
}

export interface QuestionAnswerEntity {
  id: string;
  assignment_id: string;
  question_id: string;
  response_value: string;
  justification?: string | null;
  evidence_reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireAssignmentEntity {
  id: string;
  organization_id: string;
  vendor_id: string;
  template_id: string;
  template_version: number;
  status: AssignmentStatusType;
  due_date?: string | null;
  assigned_to_email?: string | null;
  notes?: string | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  vendor_name?: string;
  template_title?: string;
  answers: QuestionAnswerEntity[];
}

export interface AssignmentCreatePayload {
  vendor_id: string;
  template_id: string;
  due_date?: string;
  assigned_to_email?: string;
  notes?: string;
}

export interface AnswerSubmissionPayload {
  question_id: string;
  response_value: string;
  justification?: string;
  evidence_reference?: string;
}

// Scaffolding types for remaining increments
export interface VendorOverview {
  id: string;
  name: string;
  domain: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  riskScore: number;
  status: 'Active' | 'Review Required' | 'Monitoring';
  lastAssessmentDate: string;
}

export interface AssessmentOverview {
  id: string;
  vendorName: string;
  framework: string;
  score: number;
  status: AssessmentStatus;
  date: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'security_alert' | 'assessment_completed' | 'vendor_added' | 'policy_updated';
  severity?: SeverityLevel;
}
