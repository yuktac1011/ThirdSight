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
