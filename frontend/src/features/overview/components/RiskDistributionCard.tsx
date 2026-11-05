import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { mockRiskDistribution } from '@/features/overview/data/mockOverviewData';

export const RiskDistributionCard: React.FC = () => {
  const total = mockRiskDistribution.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vendor Risk Distribution</CardTitle>
            <CardDescription>Aggregate posture across {total} monitored third-party suppliers (Mock Scaffolding)</CardDescription>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            Overall Health: Moderate
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual Progress Bar Segment */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 gap-0.5 p-0.5">
          {mockRiskDistribution.map((item) => (
            <div
              key={item.level}
              className={`${item.color} rounded-sm transition-all duration-300 hover:opacity-90`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.level}: ${item.count} (${item.percentage}%)`}
            />
          ))}
        </div>

        {/* Legend Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {mockRiskDistribution.map((item) => (
            <div key={item.level} className="flex flex-col p-2.5 rounded-md border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-xs font-medium text-slate-600">{item.level}</span>
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-lg font-bold text-slate-900">{item.count}</span>
                <span className="text-[11px] text-slate-600 font-mono">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

