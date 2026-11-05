import React from 'react';
import { ShieldCheck, AlertCircle, Building2, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { RiskDistributionCard } from './components/RiskDistributionCard';
import { VendorSummaryTable } from './components/VendorSummaryTable';
import { AssessmentSummaryCard } from './components/AssessmentSummaryCard';
import { RecentActivityList } from './components/RecentActivityList';
import { QuickActionsCard } from './components/QuickActionsCard';

export const OverviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome & Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Third-Party Risk Posture
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enterprise continuous threat intelligence, vendor evaluations, and compliance validation.
          </p>
        </div>

        {/* Prototype / Increment notice badge */}
        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs text-amber-800">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            Increment 01 Foundation: displaying structured mock scaffolding.
          </span>
        </div>
      </div>

      {/* Top Stat KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Vendors
            </span>
            <div className="p-2 rounded-md bg-slate-100 text-slate-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">42</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +3 this month
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">14 Tier-1 mission-critical</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Risk Score
            </span>
            <div className="p-2 rounded-md bg-brand-50 text-brand-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">74<span className="text-sm font-normal text-slate-400">/100</span></span>
            <span className="text-xs font-medium text-emerald-600">+2.4 pts</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Standard posture threshold: 70</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Assessments
            </span>
            <div className="p-2 rounded-md bg-sky-50 text-sky-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">11</span>
            <span className="text-xs font-medium text-slate-500">4 awaiting vendor</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Avg completion cycle: 4.2 days</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Critical Findings
            </span>
            <div className="p-2 rounded-md bg-rose-50 text-rose-700">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">3</span>
            <span className="text-xs font-medium text-rose-600">Requires SLA Action</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">2 CVE alerts, 1 expired cert</p>
        </Card>
      </div>

      {/* Main Grid: Risk Distribution + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RiskDistributionCard />
        </div>
        <div className="lg:col-span-1">
          <QuickActionsCard />
        </div>
      </div>

      {/* Tables & Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VendorSummaryTable />
          <AssessmentSummaryCard />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityList />
        </div>
      </div>
    </div>
  );
};

