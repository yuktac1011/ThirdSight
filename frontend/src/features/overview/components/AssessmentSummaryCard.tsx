import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockAssessments } from '@/features/overview/data/mockOverviewData';
import { ShieldCheck, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AssessmentSummaryCard: React.FC = () => {
  return (
    <Card className="hover:shadow-card-hover transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Security audit tracking & framework evaluations</CardDescription>
          </div>
          <Link
            to="/assessments"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-brand-50"
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
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-subtle transition-all gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm">{asm.vendorName}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{asm.framework}</div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-subtle">
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
