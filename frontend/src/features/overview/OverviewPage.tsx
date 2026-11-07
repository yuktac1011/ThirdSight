import React from 'react';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  FileCheck2,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Third-Party Risk Posture
            </h1>
            <Badge variant="purple" size="sm" dot>
              AI Monitoring Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Continuous threat telemetry, vendor compliance assessments, deterministic risk quantification, and automated gap remediation.
          </p>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3.5 py-1.5 text-xs text-emerald-800 shadow-subtle">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">All SecOps pipelines operational</span>
        </div>
      </div>

      {/* Top Stat KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Vendors */}
        <Card hover className="relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Vendors
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">42</span>
            <span className="text-xs font-semibold text-emerald-700 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/80">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +3
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-100">
            <span>14 Tier-1 mission-critical</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50/70 px-1.5 py-0.2 rounded">100% evaluated</span>
          </div>
        </Card>

        {/* Posture Score */}
        <Card hover className="relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mean Posture Score
            </span>
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100 transition-colors">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              74<span className="text-base font-semibold text-slate-400">/100</span>
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/80">
              +2.4 pts
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-100">
            <span>Threshold target: &ge; 70</span>
            <span className="text-emerald-700 font-bold">Low Risk</span>
          </div>
        </Card>

        {/* Active Assessments */}
        <Card hover className="relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Assessments
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-100 transition-colors">
              <FileCheck2 className="h-4 w-4 text-sky-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">11</span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              4 in review
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-100">
            <span>SIG Lite & NIST CSF 2.0</span>
            <span className="text-brand-700 font-semibold">92% on-time</span>
          </div>
        </Card>

        {/* AI Evidence Intelligence */}
        <Card hover className="relative overflow-hidden group bg-gradient-to-br from-white via-white to-purple-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Evidence Extracted
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-100 transition-colors">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">28</span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded-md border border-purple-200">
              AI verified
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-100">
            <span>Human-in-the-loop audit</span>
            <span className="text-purple-700 font-semibold flex items-center gap-0.5">
              0 breaches <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Visual Posture & Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide): Risk Distribution & Vendor Table */}
        <div className="lg:col-span-2 space-y-6">
          <RiskDistributionCard />
          <VendorSummaryTable />
        </div>

        {/* Right Column (1 col wide): Summary, Actions & Activity Feed */}
        <div className="space-y-6">
          <AssessmentSummaryCard />
          <QuickActionsCard />
          <RecentActivityList />
        </div>
      </div>
    </div>
  );
};
