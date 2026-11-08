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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Third-Party Risk Posture
            </h1>
            <Badge variant="cyan" size="sm" dot>
              AI Monitoring Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time cybersecurity threat telemetry, vendor posture evaluations, deterministic risk quantification, and gap remediation.
          </p>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">All SecOps pipelines operational</span>
        </div>
      </div>

      {/* Top Stat KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Vendors */}
        <Card hover glow="brand" className="group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Vendors
            </span>
            <div className="p-2.5 rounded-xl bg-slate-800/90 text-blue-400 border border-slate-700/80 group-hover:bg-brand-600/20 group-hover:text-blue-300 group-hover:border-brand-500/40 transition-all">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">42</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +3
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>14 Tier-1 mission-critical</span>
            <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">100% evaluated</span>
          </div>
        </Card>

        {/* Posture Score */}
        <Card hover glow="cyan" className="group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mean Posture Score
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 group-hover:bg-cyan-900/40 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              74<span className="text-base font-semibold text-slate-500">/100</span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              +2.4 pts
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>Threshold target: &ge; 70</span>
            <span className="text-emerald-400 font-bold">Low Risk</span>
          </div>
        </Card>

        {/* Active Assessments */}
        <Card hover glow="none" className="group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Assessments
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-950/40 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-900/40 transition-all">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">11</span>
            <span className="text-xs font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              4 in review
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>SIG Lite & NIST CSF 2.0</span>
            <span className="text-cyan-400 font-semibold">92% on-time</span>
          </div>
        </Card>

        {/* AI Evidence Intelligence */}
        <Card hover glow="purple" className="group bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-purple-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Evidence Extracted
            </span>
            <div className="p-2.5 rounded-xl bg-purple-950/50 text-purple-400 border border-purple-500/40 group-hover:bg-purple-900/50 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
              <Sparkles className="h-4 w-4 text-purple-300 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">28</span>
            <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-500/40">
              AI verified
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80">
            <span>Human-in-the-loop audit</span>
            <span className="text-purple-300 font-semibold flex items-center gap-0.5">
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
