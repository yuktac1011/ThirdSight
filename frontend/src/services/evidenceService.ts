import { apiClient } from './api';

export interface EvidenceItem {
  id: string;
  organization_id: string;
  vendor_id: string;
  assessment_id?: string;
  question_id?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  sha256_hash: string;
  storage_key: string;
  status: 'quarantined' | 'scanning' | 'approved' | 'rejected' | 'expired';
  scan_result?: string;
  extracted_text_preview?: string;
  rejection_reason?: string;
  rejection_comment?: string;
  reviewer_email?: string;
  reviewed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  vendor_name?: string;
}

export interface EvidenceReviewPayload {
  action: 'approve' | 'reject';
  rejection_reason?: string;
  rejection_comment?: string;
}

export const evidenceService = {
  list: async (params?: { vendor_id?: string; assessment_id?: string; status_filter?: string }): Promise<EvidenceItem[]> => {
    const res = await apiClient.get('/evidence', { params });
    return res.data;
  },

  getById: async (id: string): Promise<EvidenceItem> => {
    const res = await apiClient.get(`/evidence/${id}`);
    return res.data;
  },

  upload: async (formData: FormData): Promise<EvidenceItem> => {
    const res = await apiClient.post('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  review: async (id: string, payload: EvidenceReviewPayload): Promise<EvidenceItem> => {
    const res = await apiClient.post(`/evidence/${id}/review`, payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/evidence/${id}`);
  },

  downloadUrl: (id: string): string => {
    return `/api/v1/evidence/${id}/download`;
  },
};
