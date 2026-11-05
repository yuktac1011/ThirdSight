export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AssessmentStatus = 'completed' | 'in_progress' | 'pending' | 'flagged';

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

