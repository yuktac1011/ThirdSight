import { apiClient } from './api';

export interface AISuggestedMapping {
  control_code: string;
  control_title: string;
  relevance_score: number;
  citation: string;
  page_reference?: string;
  rationale: string;
}

export interface AIClaimDiscrepancy {
  vendor_claim: string;
  evidence_fact: string;
  discrepancy_level: 'aligned' | 'partial_conflict' | 'direct_contradiction';
  analysis: string;
}

export interface AIEvidenceInsight {
  id: string;
  evidence_id: string;
  summary: string;
  confidence_score: number;
  suggested_mappings: AISuggestedMapping[];
  discrepancies: AIClaimDiscrepancy[];
  decision: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export const aiService = {
  analyzeEvidence: async (evidenceId: string): Promise<AIEvidenceInsight> => {
    const res = await apiClient.post(`/ai/evidence/${evidenceId}/analyze`);
    return res.data;
  },

  getInsights: async (evidenceId: string): Promise<AIEvidenceInsight | null> => {
    const res = await apiClient.get(`/ai/evidence/${evidenceId}/insights`);
    return res.data;
  },

  recordDecision: async (
    evidenceId: string,
    insightId: string,
    payload: { decision: 'approve' | 'reject'; selected_control_codes?: string[] }
  ): Promise<AIEvidenceInsight> => {
    const res = await apiClient.post(`/ai/evidence/${evidenceId}/insights/${insightId}/decision`, payload);
    return res.data;
  },
};

