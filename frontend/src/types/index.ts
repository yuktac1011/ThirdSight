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

// Scaffolding types for other modules
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
