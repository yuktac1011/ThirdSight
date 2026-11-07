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
      iconClass: 'text-brand-600 bg-brand-50 border border-brand-200/70',
    },
    {
      title: 'Launch Assessment',
      desc: 'Dispatch SIG Lite or NIST CSF questionnaire',
      icon: Sparkles,
      route: '/assessments',
      iconClass: 'text-indigo-600 bg-indigo-50 border border-indigo-200/70',
    },
    {
      title: 'Upload Evidence',
      desc: 'Ingest SOC 2, ISO 27001 or audit logs',
      icon: FileUp,
      route: '/evidence',
      iconClass: 'text-sky-600 bg-sky-50 border border-sky-200/70',
    },
    {
      title: 'Generate Audit Report',
      desc: 'Export executive summary or technical PDF',
      icon: FileText,
      route: '/reports',
      iconClass: 'text-emerald-600 bg-emerald-50 border border-emerald-200/70',
    },
  ];

  return (
    <Card className="hover:shadow-card-hover transition-all duration-200">
      <CardHeader>
        <CardTitle>SecOps Quick Workflows</CardTitle>
        <CardDescription>Rapidly trigger assessment, ingestion and compliance operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              type="button"
              onClick={() => navigate(act.route)}
              className="w-full text-left p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 flex items-center justify-between group shadow-subtle"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${act.iconClass} transition-transform group-hover:scale-105 shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{act.desc}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
