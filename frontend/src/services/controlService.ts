import { apiClient } from './api';

export interface Framework {
  id: string;
  name: string;
  version: string;
  description?: string;
  created_at: string;
}

export interface ControlMapping {
  id: string;
  control_id: string;
  framework_id: string;
  framework_ref: string;
  mapping_notes?: string;
  framework_name?: string;
  framework_version?: string;
}

export interface SecurityControl {
  id: string;
  code: string;
  domain: string;
  title: string;
  description: string;
  guidance?: string;
  version: number;
  created_at: string;
  mappings: ControlMapping[];
}

export interface ControlAssessmentResult {
  id: string;
  assessment_id: string;
  control_id: string;
  control_code: string;
  control_title: string;
  control_domain: string;
  effectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_applicable' | 'unassessed';
  rationale?: string;
  evaluator_email?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  associated_evidence_ids: string[];
}

export interface FrameworkCoverageMetric {
  framework_name: string;
  framework_version: string;
  total_controls: number;
  evaluated_controls: number;
  effective_controls: number;
  partially_effective_controls: number;
  ineffective_controls: number;
  coverage_percentage: number;
}

export const controlService = {
  listFrameworks: async (): Promise<Framework[]> => {
    const res = await apiClient.get('/controls/frameworks');
    return res.data;
  },

  listControls: async (domain?: string): Promise<SecurityControl[]> => {
    const res = await apiClient.get('/controls', { params: { domain } });
    return res.data;
  },

  getControl: async (id: string): Promise<SecurityControl> => {
    const res = await apiClient.get(`/controls/${id}`);
    return res.data;
  },

  getAssessmentResults: async (assessmentId: string): Promise<ControlAssessmentResult[]> => {
    const res = await apiClient.get(`/controls/assessments/${assessmentId}/results`);
    return res.data;
  },

  evaluateControl: async (
    assessmentId: string,
    controlId: string,
    payload: { effectiveness: string; rationale?: string; evidence_ids?: string[] }
  ): Promise<ControlAssessmentResult> => {
    const res = await apiClient.post(`/controls/assessments/${assessmentId}/evaluate/${controlId}`, payload);
    return res.data;
  },

  getCoverage: async (assessmentId: string): Promise<FrameworkCoverageMetric[]> => {
    const res = await apiClient.get(`/controls/assessments/${assessmentId}/coverage`);
    return res.data;
  },
};
