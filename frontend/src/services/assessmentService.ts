import { apiClient } from '@/services/api';
import {
  AssessmentEntity,
  AssessmentCreatePayload,
  AssessmentReviewPayload,
  QuestionAnswerEntity,
} from '@/types';

export const assessmentService = {
  getAssessments: async (params?: { vendor_id?: string; status?: string; search?: string }): Promise<AssessmentEntity[]> => {
    const res = await apiClient.get<AssessmentEntity[]>('/assessments', { params });
    return res.data;
  },

  getAssessmentById: async (assessmentId: string): Promise<AssessmentEntity> => {
    const res = await apiClient.get<AssessmentEntity>(`/assessments/${assessmentId}`);
    return res.data;
  },

  createAssessment: async (payload: AssessmentCreatePayload): Promise<AssessmentEntity> => {
    const res = await apiClient.post<AssessmentEntity>('/assessments', payload);
    return res.data;
  },

  saveAnswer: async (
    assessmentId: string,
    payload: { question_id: string; response_value: string; justification?: string; evidence_reference?: string }
  ): Promise<QuestionAnswerEntity> => {
    const res = await apiClient.post<QuestionAnswerEntity>(`/assessments/${assessmentId}/answers`, payload);
    return res.data;
  },

  submitForReview: async (assessmentId: string): Promise<AssessmentEntity> => {
    const res = await apiClient.post<AssessmentEntity>(`/assessments/${assessmentId}/submit`);
    return res.data;
  },

  reviewAssessment: async (assessmentId: string, payload: AssessmentReviewPayload): Promise<AssessmentEntity> => {
    const res = await apiClient.post<AssessmentEntity>(`/assessments/${assessmentId}/review`, payload);
    return res.data;
  },
};

