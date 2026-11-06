import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/common/FeedbackStates';
import { monitoringService, NotificationItem, AuditEventItem } from '@/services/reportAndMonitoringService';

export const ContinuousMonitoringPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'notifications' | 'audit'>('notifications');

  const { data: notifications, isLoading: isNotifsLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications_list'],
    queryFn: () => monitoringService.getNotifications(),
  });

  const { data: auditEvents, isLoading: isAuditLoading } = useQuery<AuditEventItem[]>({
    queryKey: ['audit_trail_list'],
    queryFn: () => monitoringService.getAuditTrail(100),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => monitoringService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_list'] });
    },
  });

  const exportAuditCsv = () => {
    if (!auditEvents) return;
    const headers = ['Timestamp', 'Actor', 'Action', 'Resource Type', 'Resource ID', 'Details'];
    const rows = auditEvents.map((a) => [
      `"${a.created_at}"`,
      `"${a.actor_email}"`,
      `"${a.action}"`,
      `"${a.resource_type}"`,
      `"${a.resource_id || ''}"`,
      `"${(a.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thirdsight_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-brand-600" />
            Continuous Monitoring & Audit Log
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time evidence expiry tracking, reassessment scheduling reminders, and immutable audit trail.
          </p>
        </div>

        {activeTab === 'audit' && (
          <Button onClick={exportAuditCsv} variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export Audit Trail (CSV)
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="h-4 w-4" />
          Alerts & Expiry Notifications
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          Immutable Audit Trail
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {isNotifsLoading ? (
            <LoadingState message="Checking active evidence expiry dates and audit schedules..." />
          ) : notifications?.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-semibold text-slate-900">Zero Active Monitoring Alerts</h3>
              <p className="text-xs text-slate-500">All vendor evidence artifacts and assessment SLAs are within compliant bounds.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden shadow-sm">
              {notifications?.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    !notif.is_read ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        notif.notification_type === 'expiry'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-brand-50 text-brand-600'
                      }`}
                    >
                      {notif.notification_type === 'expiry' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{notif.title}</span>
                        {!notif.is_read && (
                          <span className="h-2 w-2 rounded-full bg-brand-600" title="Unread" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                      <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2">
                        <span>{new Date(notif.created_at).toLocaleString()}</span>
                        <span>•</span>
                        <Badge variant="neutral">{notif.notification_type.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => readMutation.mutate(notif.id)}
                      className="text-xs"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {isAuditLoading ? (
            <LoadingState message="Loading immutable audit log records..." />
          ) : auditEvents?.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-400">
              No audit events logged yet.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp (UTC)</th>
                      <th className="px-5 py-3.5">Actor</th>
                      <th className="px-5 py-3.5">Action Event</th>
                      <th className="px-5 py-3.5">Target Resource</th>
                      <th className="px-5 py-3.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 bg-white">
                    {auditEvents?.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {new Date(evt.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800 text-xs">
                          {evt.actor_email}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded">
                            {evt.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                          {evt.resource_type}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 max-w-md truncate">
                          {evt.details || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
