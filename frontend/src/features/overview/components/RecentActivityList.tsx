import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockRecentActivity } from '@/features/overview/data/mockOverviewData';
import { ShieldAlert, CheckCircle2, UserPlus, FileText } from 'lucide-react';

export const RecentActivityList: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'security_alert':
        return <ShieldAlert className="h-4 w-4 text-rose-600" />;
      case 'assessment_completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'vendor_added':
        return <UserPlus className="h-4 w-4 text-brand-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intelligence & Activity Feed</CardTitle>
        <CardDescription>Continuous audit trail & telemetry updates (Mock Scaffolding)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-4 divide-y divide-slate-100">
            {mockRecentActivity.map((act) => (
              <li key={act.id} className="py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-slate-100 p-1.5 shrink-0">
                    {getIcon(act.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">{act.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">{act.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
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
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

