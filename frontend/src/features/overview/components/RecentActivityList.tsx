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
          icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
          wrapper: 'bg-rose-950/50 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
        };
      case 'assessment_completed':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
          wrapper: 'bg-emerald-950/50 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        };
      case 'vendor_added':
        return {
          icon: <UserPlus className="h-4 w-4 text-cyan-400" />,
          wrapper: 'bg-cyan-950/50 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
        };
      default:
        return {
          icon: <FileText className="h-4 w-4 text-slate-400" />,
          wrapper: 'bg-slate-800/80 border border-slate-700/80',
        };
    }
  };

  return (
    <Card hover className="transition-all duration-300">
      <CardHeader>
        <CardTitle>Intelligence & Activity Feed</CardTitle>
        <CardDescription>Continuous audit trail & telemetry updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-3 divide-y divide-slate-800/70">
            {mockRecentActivity.map((act) => {
              const { icon, wrapper } = getIcon(act.type);
              return (
                <li key={act.id} className="py-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`mt-0.5 rounded-xl p-2 shrink-0 ${wrapper}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white truncate">{act.title}</p>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono font-medium">{act.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{act.description}</p>
                      {act.severity && (
                        <div className="mt-2">
                          <Badge severity={act.severity} size="sm" dot>
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
