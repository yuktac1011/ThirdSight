import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { mockRiskDistribution } from '@/features/overview/data/mockOverviewData';

export const RiskDistributionCard: React.FC = () => {
  const total = mockRiskDistribution.reduce((acc, curr) => acc + curr.count, 0);

  const riskThemes: Record<string, { bar: string; badge: string; text: string; dot: string; glow: string }> = {
    Critical: {
      bar: 'bg-rose-500 shadow-[0_0_12px_#f43f5e]',
      badge: 'bg-rose-950/40 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
      text: 'text-rose-400',
      dot: 'bg-rose-400 shadow-[0_0_6px_#fb7185]',
      glow: 'shadow-glow-danger/20',
    },
    High: {
      bar: 'bg-amber-500 shadow-[0_0_12px_#f59e0b]',
      badge: 'bg-amber-950/40 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      text: 'text-amber-400',
      dot: 'bg-amber-400 shadow-[0_0_6px_#fcd34d]',
      glow: 'shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]',
    },
    Medium: {
      bar: 'bg-yellow-400 shadow-[0_0_12px_#facc15]',
      badge: 'bg-yellow-950/40 text-yellow-300 border-yellow-500/40 shadow-[0_0_15px_rgba(250,204,21,0.15)]',
      text: 'text-yellow-400',
      dot: 'bg-yellow-400 shadow-[0_0_6px_#fef08a]',
      glow: 'shadow-[0_0_20px_-3px_rgba(250,204,21,0.2)]',
    },
    Low: {
      bar: 'bg-emerald-500 shadow-[0_0_12px_#10b981]',
      badge: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400 shadow-[0_0_6px_#6ee7b7]',
      glow: 'shadow-[0_0_20px_-3px_rgba(16,185,129,0.2)]',
    },
  };

  return (
    <Card hover className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vendor Risk Distribution</CardTitle>
            <CardDescription>Aggregate risk posture across {total} monitored third-party suppliers</CardDescription>
          </div>
          <span className="text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            Posture: Resilient
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual Progress Bar Segment with Neon Glow */}
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800/80 gap-1.5">
          {mockRiskDistribution.map((item) => {
            const theme = riskThemes[item.level] || { bar: 'bg-slate-500' };
            return (
              <div
                key={item.level}
                className={`${theme.bar} rounded-full transition-all duration-500 hover:brightness-125`}
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
              badge: 'bg-slate-900 text-slate-300 border-slate-700',
              text: 'text-slate-200',
              dot: 'bg-slate-400',
              glow: '',
            };

            return (
              <div
                key={item.level}
                className={`flex flex-col p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 ${theme.badge}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                    <span className="text-xs font-bold text-white">{item.level}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {item.percentage}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-white tracking-tight">{item.count}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vendors</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
