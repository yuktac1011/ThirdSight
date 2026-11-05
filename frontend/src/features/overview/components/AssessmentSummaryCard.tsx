import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockAssessments } from '@/features/overview/data/mockOverviewData';
import { ShieldCheck, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AssessmentSummaryCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Assessments & Reviews</CardTitle>
            <CardDescription>Security audit tracking & framework evaluations (Mock Scaffolding)</CardDescription>
          </div>
          <Link
            to="/assessments"
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
          >
            All Assessments <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockAssessments.map((asm) => {
            let statusBadgeVariant: 'success' | 'warning' | 'danger' | 'info' = 'info';
            let statusIcon = <Clock className="h-3.5 w-3.5 mr-1" />;

            if (asm.status === 'completed') {
              statusBadgeVariant = 'success';
              statusIcon = <ShieldCheck className="h-3.5 w-3.5 mr-1" />;
            } else if (asm.status === 'flagged') {
              statusBadgeVariant = 'danger';
              statusIcon = <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
            }

            return (
              <div
                key={asm.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors gap-2"
              >
                <div>
                  <div className="font-medium text-slate-900 text-xs sm:text-sm">{asm.vendorName}</div>
                  <div className="text-[11px] text-slate-500">{asm.framework}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-medium text-slate-700">
                    Score: {asm.score}/100
                  </span>
                  <Badge variant={statusBadgeVariant} size="sm">
                    {statusIcon}
                    <span className="capitalize">{asm.status.replace('_', ' ')}</span>
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
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

