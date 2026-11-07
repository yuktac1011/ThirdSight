import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { mockRiskDistribution } from '@/features/overview/data/mockOverviewData';

export const RiskDistributionCard: React.FC = () => {
  const total = mockRiskDistribution.reduce((acc, curr) => acc + curr.count, 0);

  // Modern refined enterprise risk styling tokens
  const riskThemes: Record<string, { bar: string; badge: string; text: string; dot: string }> = {
    Critical: {
      bar: 'bg-rose-500 shadow-sm',
      badge: 'bg-rose-50/80 text-rose-700 border-rose-200/90',
      text: 'text-rose-700',
      dot: 'bg-rose-500 ring-2 ring-rose-200',
    },
    High: {
      bar: 'bg-amber-500 shadow-sm',
      badge: 'bg-amber-50/80 text-amber-700 border-amber-200/90',
      text: 'text-amber-700',
      dot: 'bg-amber-500 ring-2 ring-amber-200',
    },
    Medium: {
      bar: 'bg-yellow-400 shadow-sm',
      badge: 'bg-yellow-50/80 text-yellow-800 border-yellow-200/90',
      text: 'text-yellow-800',
      dot: 'bg-yellow-400 ring-2 ring-yellow-200',
    },
    Low: {
      bar: 'bg-emerald-500 shadow-sm',
      badge: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/90',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500 ring-2 ring-emerald-200',
    },
  };

  return (
    <Card className="hover:shadow-card-hover transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vendor Risk Distribution</CardTitle>
            <CardDescription>Aggregate risk posture across {total} monitored third-party suppliers</CardDescription>
          </div>
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-subtle flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            Posture: Resilient
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual Progress Bar Segment */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner gap-1">
          {mockRiskDistribution.map((item) => {
            const theme = riskThemes[item.level] || { bar: 'bg-slate-400' };
            return (
              <div
                key={item.level}
                className={`${theme.bar} rounded-full transition-all duration-300 hover:opacity-90`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.level}: ${item.count} (${item.percentage}%)`}
              />
            );
          })}
        </div>

        {/* Legend Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {mockRiskDistribution.map((item) => {
            const theme = riskThemes[item.level] || {
              badge: 'bg-slate-50 text-slate-700 border-slate-200',
              text: 'text-slate-900',
              dot: 'bg-slate-400',
            };

            return (
              <div
                key={item.level}
                className={`flex flex-col p-3 rounded-xl border transition-all ${theme.badge} hover:bg-white hover:shadow-subtle`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                    <span className="text-xs font-bold text-slate-800">{item.level}</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                    {item.percentage}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{item.count}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Vendors</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
