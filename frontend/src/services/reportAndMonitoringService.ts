import { apiClient } from './api';

export interface ReportItem {
  id: string;
  assessment_id: string;
  organization_id: string;
  report_type: 'executive' | 'technical';
  title: string;
  version: number;
  storage_key: string;
  sha256_hash: string;
  file_size: number;
  generated_by: string;
  generated_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_email: string;
  title: string;
  message: string;
  notification_type: 'expiry' | 'reminder' | 'finding_sla' | 'assessment' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface AuditEventItem {
  id: string;
  organization_id: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export const reportService = {
  generateReport: async (payload: { assessment_id: string; report_type: string }): Promise<ReportItem> => {
    const res = await apiClient.post('/reports/generate', payload);
    return res.data;
  },

  listReports: async (assessmentId?: string): Promise<ReportItem[]> => {
    const res = await apiClient.get('/reports', { params: { assessment_id: assessmentId } });
    return res.data;
  },

  downloadUrl: (reportId: string): string => {
    return `/api/v1/reports/${reportId}/download`;
  },
};

export const monitoringService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },

  markAsRead: async (notificationId: string): Promise<NotificationItem> => {
    const res = await apiClient.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  getAuditTrail: async (limit: number = 50): Promise<AuditEventItem[]> => {
    const res = await apiClient.get('/audit/events', { params: { limit } });
    return res.data;
  },
};

