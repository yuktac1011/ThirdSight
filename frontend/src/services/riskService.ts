import { apiClient } from './api';

export interface RiskScore {
  id: string;
  assessment_id: string;
  organization_id: string;
  methodology_version: string;
  likelihood: number;
  impact: number;
  inherent_score: number;
  inherent_band: 'low' | 'medium' | 'high' | 'critical';
  control_effectiveness_score: number;
  residual_score: number;
  residual_band: 'low' | 'medium' | 'high' | 'critical';
  explanation?: string;
  calculated_at: string;
}

export interface Remediation {
  id: string;
  finding_id: string;
  title: string;
  action_plan: string;
  owner_email: string;
  due_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface RiskAcceptance {
  id: string;
  finding_id: string;
  approver_email: string;
  rationale: string;
  compensating_controls?: string;
  expires_at: string;
  created_at: string;
}

export interface Finding {
  id: string;
  assessment_id: string;
  organization_id: string;
  control_id?: string;
  control_code?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_remediation' | 'accepted' | 'resolved';
  identified_at: string;
  closed_at?: string;
  remediations: Remediation[];
  risk_acceptance?: RiskAcceptance;
}

export const riskService = {
  calculateRisk: async (assessmentId: string): Promise<RiskScore> => {
    const res = await apiClient.post(`/risk/assessments/${assessmentId}/calculate`);
    return res.data;
  },

  getAssessmentRisk: async (assessmentId: string): Promise<RiskScore | null> => {
    const res = await apiClient.get(`/risk/assessments/${assessmentId}`);
    return res.data;
  },

  getFindings: async (assessmentId: string): Promise<Finding[]> => {
    const res = await apiClient.get(`/risk/assessments/${assessmentId}/findings`);
    return res.data;
  },

  createRemediation: async (
    findingId: string,
    payload: { title: string; action_plan: string; owner_email: string; due_date: string }
  ): Promise<Remediation> => {
    const res = await apiClient.post(`/risk/findings/${findingId}/remediations`, payload);
    return res.data;
  },

  updateRemediationStatus: async (
    remediationId: string,
    payload: { status: string; action_plan?: string }
  ): Promise<Remediation> => {
    const res = await apiClient.patch(`/risk/remediations/${remediationId}`, payload);
    return res.data;
  },

  acceptRisk: async (
    findingId: string,
    payload: { rationale: string; compensating_controls?: string; expires_at: string }
  ): Promise<RiskAcceptance> => {
    const res = await apiClient.post(`/risk/findings/${findingId}/accept-risk`, payload);
    return res.data;
  },
};

