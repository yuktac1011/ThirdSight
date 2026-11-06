import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { questionnaireService } from '@/services/questionnaireService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import { AssignmentModal } from './components/AssignmentModal';
import {
  FileQuestion,
  ArrowLeft,
  Copy,
  Send,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

export const TemplateDetailPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['template_detail', templateId],
    queryFn: () => questionnaireService.getTemplateById(templateId!),
    enabled: !!templateId,
  });

  const branchVersionMutation = useMutation({
    mutationFn: () => questionnaireService.createTemplateVersion(templateId!),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire_templates'] });
      navigate(`/questionnaires/templates/${newTemplate.id}`);
    },
  });

  if (isLoading) return <LoadingState message="Loading questionnaire template specification..." />;
  if (error || !template) return <ErrorState message="Could not locate questionnaire template." />;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/questionnaires')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Templates
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {template.title}
              </h1>
              <Badge variant="info" size="sm">
                v{template.version}
              </Badge>
              <Badge
                variant={template.status === 'published' ? 'success' : 'neutral'}
                size="sm"
              >
                {template.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Framework: <span className="font-semibold text-slate-700">{template.framework_tag}</span> •{' '}
              {template.questions.length} Questions defined
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => branchVersionMutation.mutate()}
            isLoading={branchVersionMutation.isPending}
            leftIcon={<Copy className="h-4 w-4" />}
            title="Create next version (v+1) for audit adjustments"
          >
            Branch Next Version
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Dispatch to Vendor
          </Button>
        </div>
      </div>

      {template.description && (
        <Card className="bg-slate-50/70 border-slate-200/80 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Audit Scope & Respondent Instructions
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">{template.description}</p>
        </Card>
      )}

      {/* Questions Catalogue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Categorized Question Catalogue ({template.questions.length})
          </h3>
          <span className="text-xs text-slate-500">
            Preview Mode • Read-Only Definition
          </span>
        </div>

        {template.questions.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No questions defined in this template version.</p>
          </Card>
        ) : (
          template.questions.map((q, idx) => (
            <Card key={q.id} className="p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      #{idx + 1}
                    </span>
                    <Badge variant="default" size="sm">
                      {q.domain}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500">
                      Weight: {q.weight}x
                    </span>
                    {q.is_mandatory && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                        Mandatory
                      </span>
                    )}
                    {q.requires_evidence && (
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <FileCheck2 className="h-3 w-3" /> Evidence Required
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {q.text}
                  </p>

                  {q.guidance && (
                    <div className="mt-2 text-xs text-slate-500 flex items-start gap-1.5 bg-slate-50 p-2 rounded">
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{q.guidance}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-mono text-slate-500 block uppercase">
                    Format: {q.question_type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        preselectedTemplateId={template.id}
      />
    </div>
  );
};
