import { VendorOverview, AssessmentOverview, ActivityItem } from '@/types';

/**
 * MOCK DATA NOTE:
 * The data below provides UI scaffolding for Increment 01.
 * It is completely isolated and designed to be replaced with real TanStack Query API calls
 * when backend risk assessment and vendor endpoints are integrated in future increments.
 */

export const mockRiskDistribution = [
  { level: 'Critical', count: 3, percentage: 7, color: 'bg-red-500', border: 'border-red-200' },
  { level: 'High', count: 8, percentage: 19, color: 'bg-orange-500', border: 'border-orange-200' },
  { level: 'Medium', count: 18, percentage: 43, color: 'bg-amber-500', border: 'border-amber-200' },
  { level: 'Low', count: 13, percentage: 31, color: 'bg-emerald-500', border: 'border-emerald-200' },
];

export const mockVendors: VendorOverview[] = [
  {
    id: 'v-001',
    name: 'CloudScale Infrastructure',
    domain: 'cloudscale.internal',
    tier: 'Tier 1',
    riskScore: 84,
    status: 'Active',
    lastAssessmentDate: '2026-10-24',
  },
  {
    id: 'v-002',
    name: 'PayBridge Gateways Inc.',
    domain: 'paybridge-api.com',
    tier: 'Tier 1',
    riskScore: 62,
    status: 'Review Required',
    lastAssessmentDate: '2026-11-02',
  },
  {
    id: 'v-003',
    name: 'OmniAnalytics Data Labs',
    domain: 'omnidata.io',
    tier: 'Tier 2',
    riskScore: 91,
    status: 'Active',
    lastAssessmentDate: '2026-09-15',
  },
  {
    id: 'v-004',
    name: 'LogiHost Solutions',
    domain: 'logihost-mesh.net',
    tier: 'Tier 2',
    riskScore: 48,
    status: 'Monitoring',
    lastAssessmentDate: '2026-11-04',
  },
  {
    id: 'v-005',
    name: 'AuthCore Identity Systems',
    domain: 'authcore.auth-idp.com',
    tier: 'Tier 1',
    riskScore: 78,
    status: 'Active',
    lastAssessmentDate: '2026-10-30',
  },
];

export const mockAssessments: AssessmentOverview[] = [
  {
    id: 'asm-101',
    vendorName: 'PayBridge Gateways Inc.',
    framework: 'SOC 2 Type II / ISO 27001',
    score: 62,
    status: 'flagged',
    date: '2026-11-02',
  },
  {
    id: 'asm-102',
    vendorName: 'CloudScale Infrastructure',
    framework: 'NIST CSF v2.0',
    score: 84,
    status: 'completed',
    date: '2026-10-24',
  },
  {
    id: 'asm-103',
    vendorName: 'LogiHost Solutions',
    framework: 'SIG Lite 2026',
    score: 48,
    status: 'in_progress',
    date: '2026-11-04',
  },
  {
    id: 'asm-104',
    vendorName: 'AuthCore Identity Systems',
    framework: 'FedRAMP Moderate',
    score: 78,
    status: 'completed',
    date: '2026-10-30',
  },
];

export const mockRecentActivity: ActivityItem[] = [
  {
    id: 'act-001',
    title: 'Critical CVE flagged in Vendor SDK',
    description: 'PayBridge Gateways reported an unpatched CVE-2026-3829 on payment tokenization endpoints.',
    timestamp: '2 hours ago',
    type: 'security_alert',
    severity: 'critical',
  },
  {
    id: 'act-002',
    title: 'SOC 2 Type II Evidence Validated',
    description: 'CloudScale Infrastructure provided verified continuous audit evidence.',
    timestamp: '5 hours ago',
    type: 'assessment_completed',
    severity: 'low',
  },
  {
    id: 'act-003',
    title: 'New Vendor Evaluation Initiated',
    description: 'LogiHost Solutions onboarded into Tier 2 automated questionnaire workflow.',
    timestamp: '1 day ago',
    type: 'vendor_added',
    severity: 'info',
  },
  {
    id: 'act-004',
    title: 'Policy Exception Expiring',
    description: 'OmniAnalytics Data Labs cross-border replication exemption expires in 7 days.',
    timestamp: '2 days ago',
    type: 'policy_updated',
    severity: 'medium',
  },
];

