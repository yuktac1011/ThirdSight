import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { questionnaireService } from '@/services/questionnaireService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import {
  ArrowLeft,
  CheckCircle2,
  Building2,
  FileCheck2,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const AssessmentResponsePage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeResponses, setActiveResponses] = useState<Record<string, string>>({});
  const [activeJustifications, setActiveJustifications] = useState<Record<string, string>>({});
  const [activeEvidenceRefs, setActiveEvidenceRefs] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: assignment,
    isLoading: isAssignmentLoading,
    error: assignmentError,
  } = useQuery({
    queryKey: ['assignment_detail', assignmentId],
    queryFn: () => questionnaireService.getAssignmentById(assignmentId!),
    enabled: !!assignmentId,
  });

  const { data: template, isLoading: isTemplateLoading } = useQuery({
    queryKey: ['template_for_assignment', assignment?.template_id],
    queryFn: () => questionnaireService.getTemplateById(assignment!.template_id),
    enabled: !!assignment?.template_id,
  });

  // Pre-fill existing answers
  React.useEffect(() => {
    if (assignment && assignment.answers) {
      const respMap: Record<string, string> = {};
      const justMap: Record<string, string> = {};
      const evidMap: Record<string, string> = {};

      assignment.answers.forEach((ans) => {
        respMap[ans.question_id] = ans.response_value;
        if (ans.justification) justMap[ans.question_id] = ans.justification;
        if (ans.evidence_reference) evidMap[ans.question_id] = ans.evidence_reference;
      });

      setActiveResponses(respMap);
      setActiveJustifications(justMap);
      setActiveEvidenceRefs(evidMap);
    }
  }, [assignment]);

  const answerMutation = useMutation({
    mutationFn: (payload: { questionId: string; responseValue: string; justification?: string; evidence?: string }) =>
      questionnaireService.submitAnswer(assignmentId!, {
        question_id: payload.questionId,
        response_value: payload.responseValue,
        justification: payload.justification,
        evidence_reference: payload.evidence,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment_detail', assignmentId] });
      setSubmitError(null);
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.detail || 'Failed to record answer.');
    },
  });

  const handleSaveQuestionResponse = (qId: string) => {
    setSubmitError(null);
    const responseVal = activeResponses[qId];
    if (!responseVal) {
      setSubmitError('Please choose or enter a response value before saving.');
      return;
    }

    const justification = activeJustifications[qId];
    // Enforce front-end check for N/A or Partial justification
    if (['na', 'n/a', 'partial'].includes(responseVal.toLowerCase())) {
      if (!justification || justification.trim().length < 5) {
        setSubmitError(`A detailed explanation (minimum 5 characters) is required when choosing '${responseVal.toUpperCase()}'.`);
        return;
      }
    }

    answerMutation.mutate({
      questionId: qId,
      responseValue: responseVal,
      justification: justification?.trim() || undefined,
      evidence: activeEvidenceRefs[qId]?.trim() || undefined,
    });
  };

  if (isAssignmentLoading || isTemplateLoading) return <LoadingState message="Loading vendor assessment audit workspace..." />;
  if (assignmentError || !assignment || !template) return <ErrorState message="Could not find assignment record." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/questionnaires')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Assessments
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {assignment.template_title}
              </h1>
              <Badge
                variant={assignment.status === 'completed' ? 'success' : 'warning'}
                size="sm"
              >
                {assignment.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-brand-600" />
                {assignment.vendor_name}
              </span>
              <span>•</span>
              <span>Recipient: {assignment.assigned_to_email || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Audit Progress
            </span>
            <span className="text-sm font-bold text-slate-900">
              {assignment.completion_percentage}% Answered
            </span>
          </div>
          <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${assignment.completion_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Questions Answering Form List */}
      <div className="space-y-4">
        {template.questions.map((q, idx) => {
          const currentVal = activeResponses[q.id] || '';
          const currentJust = activeJustifications[q.id] || '';
          const currentEvidence = activeEvidenceRefs[q.id] || '';
          const isAnswered = !!assignment.answers.find((a) => a.question_id === q.id);
          const needsJustification = ['na', 'n/a', 'partial'].includes(currentVal.toLowerCase());

          return (
            <Card
              key={q.id}
              className={`p-5 transition-all ${
                isAnswered ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    #{idx + 1}
                  </span>
                  <Badge variant="default" size="sm">
                    {q.domain}
                  </Badge>
                  {isAnswered && (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Answer Saved
                    </Badge>
                  )}
                  {q.requires_evidence && (
                    <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <FileCheck2 className="h-3 w-3" /> Artifact Recommended
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono text-slate-400">
                  Weight: {q.weight}x
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-1">
                {q.text}
              </h4>
              {q.guidance && (
                <p className="text-xs text-slate-500 mb-3">{q.guidance}</p>
              )}

              {/* Response Controls */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                {q.question_type === 'choice_partial' ? (
                  <div className="flex flex-wrap gap-2">
                    {['Yes', 'Partial', 'No', 'N/A'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setActiveResponses((prev) => ({ ...prev, [q.id]: opt.toLowerCase() }))
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                          currentVal.toLowerCase() === opt.toLowerCase()
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : q.question_type === 'yes_no' ? (
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setActiveResponses((prev) => ({ ...prev, [q.id]: opt.toLowerCase() }))
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                          currentVal.toLowerCase() === opt.toLowerCase()
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    placeholder="Enter written assessment response..."
                    value={currentVal}
                    onChange={(e) =>
                      setActiveResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    className="w-full text-xs p-2 rounded border border-slate-300"
                  />
                )}

                {/* Justification Box (Mandatory for N/A or Partial) */}
                {needsJustification && (
                  <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 space-y-1">
                    <label className="block text-xs font-bold text-amber-900">
                      Justification & Compensating Controls (Mandatory for {currentVal.toUpperCase()})
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explain why this control is not applicable or what alternative security safeguards exist..."
                      value={currentJust}
                      onChange={(e) =>
                        setActiveJustifications((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="w-full text-xs p-2 rounded border border-amber-300 bg-white"
                    />
                  </div>
                )}

                {/* Evidence Pointer Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Evidence Reference / Policy doc (optional)"
                    value={currentEvidence}
                    onChange={(e) =>
                      setActiveEvidenceRefs((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    leftIcon={<FileText className="h-3.5 w-3.5" />}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveQuestionResponse(q.id)}
                      isLoading={answerMutation.isPending}
                    >
                      Save Question #{idx + 1}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
