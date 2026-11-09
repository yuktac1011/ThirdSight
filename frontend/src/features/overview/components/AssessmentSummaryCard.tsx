import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockAssessments } from '@/features/overview/data/mockOverviewData';
import { ShieldCheck, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AssessmentSummaryCard: React.FC = () => {
  return (
    <Card hover className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Security audit tracking & framework evaluations</CardDescription>
          </div>
          <Link
            to="/assessments"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {mockAssessments.map((asm) => {
            let statusBadgeVariant: 'success' | 'warning' | 'danger' | 'info' = 'info';
            let statusIcon = <Clock className="h-3.5 w-3.5" />;

            if (asm.status === 'completed') {
              statusBadgeVariant = 'success';
              statusIcon = <ShieldCheck className="h-3.5 w-3.5" />;
            } else if (asm.status === 'flagged') {
              statusBadgeVariant = 'danger';
              statusIcon = <AlertTriangle className="h-3.5 w-3.5" />;
            }

            return (
              <div
                key={asm.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 transition-all gap-2 shadow-subtle hover:-translate-y-0.5"
              >
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm">{asm.vendorName}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">{asm.framework}</div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 shadow-inner">
                    {asm.score}/100
                  </span>
                  <Badge variant={statusBadgeVariant} size="sm">
                    {statusIcon}
                    <span className="capitalize ml-1">{asm.status.replace('_', ' ')}</span>
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-500 font-medium hidden sm:inline-block">
                    {asm.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
