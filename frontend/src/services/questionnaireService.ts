import { apiClient } from '@/services/api';
import {
  QuestionnaireTemplateEntity,
  QuestionnaireTemplateCreatePayload,
  QuestionEntity,
  QuestionnaireAssignmentEntity,
  AssignmentCreatePayload,
  AnswerSubmissionPayload,
  QuestionAnswerEntity,
} from '@/types';

export const questionnaireService = {
  // Templates
  getTemplates: async (params?: { search?: string; status?: string }): Promise<QuestionnaireTemplateEntity[]> => {
    const res = await apiClient.get<QuestionnaireTemplateEntity[]>('/questionnaires/templates', { params });
    return res.data;
  },

  getTemplateById: async (templateId: string): Promise<QuestionnaireTemplateEntity> => {
    const res = await apiClient.get<QuestionnaireTemplateEntity>(`/questionnaires/templates/${templateId}`);
    return res.data;
  },

  createTemplate: async (payload: QuestionnaireTemplateCreatePayload): Promise<QuestionnaireTemplateEntity> => {
    const res = await apiClient.post<QuestionnaireTemplateEntity>('/questionnaires/templates', payload);
    return res.data;
  },

  updateTemplate: async (
    templateId: string,
    payload: { title?: string; description?: string; framework_tag?: string; status?: string }
  ): Promise<QuestionnaireTemplateEntity> => {
    const res = await apiClient.patch<QuestionnaireTemplateEntity>(`/questionnaires/templates/${templateId}`, payload);
    return res.data;
  },

  createTemplateVersion: async (templateId: string): Promise<QuestionnaireTemplateEntity> => {
    const res = await apiClient.post<QuestionnaireTemplateEntity>(`/questionnaires/templates/${templateId}/version`);
    return res.data;
  },

  deleteTemplate: async (templateId: string): Promise<void> => {
    await apiClient.delete(`/questionnaires/templates/${templateId}`);
  },

  // Questions
  addQuestion: async (templateId: string, payload: any): Promise<QuestionEntity> => {
    const res = await apiClient.post<QuestionEntity>(`/questionnaires/templates/${templateId}/questions`, payload);
    return res.data;
  },

  updateQuestion: async (questionId: string, payload: any): Promise<QuestionEntity> => {
    const res = await apiClient.patch<QuestionEntity>(`/questionnaires/questions/${questionId}`, payload);
    return res.data;
  },

  deleteQuestion: async (questionId: string): Promise<void> => {
    await apiClient.delete(`/questionnaires/questions/${questionId}`);
  },

  // Assignments
  getAssignments: async (params?: { vendor_id?: string; status?: string }): Promise<QuestionnaireAssignmentEntity[]> => {
    const res = await apiClient.get<QuestionnaireAssignmentEntity[]>('/questionnaires/assignments', { params });
    return res.data;
  },

  getAssignmentById: async (assignmentId: string): Promise<QuestionnaireAssignmentEntity> => {
    const res = await apiClient.get<QuestionnaireAssignmentEntity>(`/questionnaires/assignments/${assignmentId}`);
    return res.data;
  },

  createAssignment: async (payload: AssignmentCreatePayload): Promise<QuestionnaireAssignmentEntity> => {
    const res = await apiClient.post<QuestionnaireAssignmentEntity>('/questionnaires/assignments', payload);
    return res.data;
  },

  submitAnswer: async (assignmentId: string, payload: AnswerSubmissionPayload): Promise<QuestionAnswerEntity> => {
    const res = await apiClient.post<QuestionAnswerEntity>(`/questionnaires/assignments/${assignmentId}/answers`, payload);
    return res.data;
  },
};

