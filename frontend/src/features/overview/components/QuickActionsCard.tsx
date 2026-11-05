import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusCircle, FileUp, Sparkles, DownloadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>SecOps Quick Actions</CardTitle>
        <CardDescription>Initiate risk workflows and vendor compliance audits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-3 px-3 flex flex-col items-start text-left justify-start gap-1 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => navigate('/vendors')}
          >
            <div className="flex items-center gap-2 text-slate-900 font-medium text-xs">
              <PlusCircle className="h-4 w-4 text-brand-600 shrink-0" />
              Onboard Vendor
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              Register domain and assign Tier
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 px-3 flex flex-col items-start text-left justify-start gap-1 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => navigate('/assessments')}
          >
            <div className="flex items-center gap-2 text-slate-900 font-medium text-xs">
              <Sparkles className="h-4 w-4 text-brand-600 shrink-0" />
              Launch Assessment
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              Dispatch framework questionnaire
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 px-3 flex flex-col items-start text-left justify-start gap-1 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => navigate('/evidence')}
          >
            <div className="flex items-center gap-2 text-slate-900 font-medium text-xs">
              <FileUp className="h-4 w-4 text-brand-600 shrink-0" />
              Upload SOC 2 / Evidence
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              Ingest certification or audit logs
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 px-3 flex flex-col items-start text-left justify-start gap-1 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => navigate('/reports')}
          >
            <div className="flex items-center gap-2 text-slate-900 font-medium text-xs">
              <DownloadCloud className="h-4 w-4 text-brand-600 shrink-0" />
              Generate Risk Report
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              Export board-ready intelligence
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
