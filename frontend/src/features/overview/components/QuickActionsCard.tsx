import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { PlusCircle, FileUp, Sparkles, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Onboard Vendor',
      desc: 'Register domain, tier, and contact details',
      icon: PlusCircle,
      route: '/vendors',
      iconClass: 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]',
    },
    {
      title: 'Launch Assessment',
      desc: 'Dispatch SIG Lite or NIST CSF questionnaire',
      icon: Sparkles,
      route: '/assessments',
      iconClass: 'text-indigo-400 bg-indigo-950/40 border border-indigo-500/30 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]',
    },
    {
      title: 'Upload Evidence',
      desc: 'Ingest SOC 2, ISO 27001 or audit logs',
      icon: FileUp,
      route: '/evidence',
      iconClass: 'text-blue-400 bg-blue-950/40 border border-blue-500/30 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]',
    },
    {
      title: 'Generate Audit Report',
      desc: 'Export executive summary or technical PDF',
      icon: FileText,
      route: '/reports',
      iconClass: 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    },
  ];

  return (
    <Card hover className="transition-all duration-300">
      <CardHeader>
        <CardTitle>SecOps Quick Workflows</CardTitle>
        <CardDescription>Rapidly trigger assessment, ingestion and compliance operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              type="button"
              onClick={() => navigate(act.route)}
              className="w-full text-left p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 transition-all duration-200 flex items-center justify-between group shadow-subtle hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl ${act.iconClass} transition-transform group-hover:scale-105 shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{act.desc}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
