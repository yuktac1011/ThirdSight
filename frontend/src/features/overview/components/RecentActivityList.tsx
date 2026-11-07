import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockRecentActivity } from '@/features/overview/data/mockOverviewData';
import { ShieldAlert, CheckCircle2, UserPlus, FileText } from 'lucide-react';

export const RecentActivityList: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'security_alert':
        return {
          icon: <ShieldAlert className="h-4 w-4 text-rose-600" />,
          wrapper: 'bg-rose-50 border border-rose-200/80',
        };
      case 'assessment_completed':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          wrapper: 'bg-emerald-50 border border-emerald-200/80',
        };
      case 'vendor_added':
        return {
          icon: <UserPlus className="h-4 w-4 text-brand-600" />,
          wrapper: 'bg-brand-50 border border-brand-200/80',
        };
      default:
        return {
          icon: <FileText className="h-4 w-4 text-slate-500" />,
          wrapper: 'bg-slate-100 border border-slate-200/80',
        };
    }
  };

  return (
    <Card className="hover:shadow-card-hover transition-all duration-200">
      <CardHeader>
        <CardTitle>Intelligence & Activity Feed</CardTitle>
        <CardDescription>Continuous audit trail & telemetry updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-3 divide-y divide-slate-100">
            {mockRecentActivity.map((act) => {
              const { icon, wrapper } = getIcon(act.type);
              return (
                <li key={act.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-lg p-2 shrink-0 ${wrapper}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 truncate">{act.title}</p>
                        <span className="text-[10px] text-slate-600 shrink-0 font-mono font-medium">{act.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{act.description}</p>
                      {act.severity && (
                        <div className="mt-1.5">
                          <Badge severity={act.severity} size="sm">
                            {act.severity.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
