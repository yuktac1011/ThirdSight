import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '@/services/assessmentService';
import { questionnaireService } from '@/services/questionnaireService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import { AssessmentStatusBadge } from './components/AssessmentStatusBadge';
import {
  ArrowLeft,
  FileCheck2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Lock,
  Save,
} from 'lucide-react';

export const VendorResponsePortalPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [evidenceRefs, setEvidenceRefs] = useState<Record<string, string>>({});
  const [activeError, setActiveError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const {
    data: assessment,
    isLoading: isAssessmentLoading,
    error: assessmentError,
  } = useQuery({
    queryKey: ['assessment_portal', assessmentId],
    queryFn: () => assessmentService.getAssessmentById(assessmentId!),
    enabled: !!assessmentId,
  });

  const { data: template, isLoading: isTemplateLoading } = useQuery({
    queryKey: ['template_for_portal', assessment?.template_id],
    queryFn: () => questionnaireService.getTemplateById(assessment!.template_id),
    enabled: !!assessment?.template_id,
  });

  React.useEffect(() => {
    if (assessment?.answers) {
      const respMap: Record<string, string> = {};
      const justMap: Record<string, string> = {};
      const evidMap: Record<string, string> = {};

      assessment.answers.forEach((ans) => {
        respMap[ans.question_id] = ans.response_value;
        if (ans.justification) justMap[ans.question_id] = ans.justification;
        if (ans.evidence_reference) evidMap[ans.question_id] = ans.evidence_reference;
      });

      setResponses(respMap);
      setJustifications(justMap);
      setEvidenceRefs(evidMap);
    }
  }, [assessment]);

  const saveMutation = useMutation({
    mutationFn: (payload: { questionId: string; val: string; just?: string; evid?: string }) =>
      assessmentService.saveAnswer(assessmentId!, {
        question_id: payload.questionId,
        response_value: payload.val,
        justification: payload.just,
        evidence_reference: payload.evid,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment_portal', assessmentId] });
      setSaveSuccessMsg('Control response saved.');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
      setActiveError(null);
    },
    onError: (err: any) => {
      setActiveError(err.response?.data?.detail || 'Failed to save control answer.');
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => assessmentService.submitForReview(assessmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment_portal', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment_detail', assessmentId] });
      setActiveError(null);
    },
    onError: (err: any) => {
      setActiveError(err.response?.data?.detail || 'Submission failed.');
    },
  });

  if (isAssessmentLoading || isTemplateLoading) {
    return <LoadingState message="Loading ThirdSight Vendor Respondent Workspace..." />;
  }
  if (assessmentError || !assessment || !template) {
    return <ErrorState message="Could not find assessment record or unauthorized access." />;
  }

  const isLocked = assessment.is_locked;

  const handleSaveQuestion = (qId: string) => {
    setActiveError(null);
    const val = responses[qId];
    if (!val) {
      setActiveError('Please choose or enter a response value before saving.');
      return;
    }

    const just = justifications[qId];
    if (['na', 'n/a', 'partial'].includes(val.toLowerCase())) {
      if (!just || just.trim().length < 5) {
        setActiveError(
          `Detailed explanation (minimum 5 characters) is required when responding '${val.toUpperCase()}'.`
        );
        return;
      }
    }

    saveMutation.mutate({
      questionId: qId,
      val,
      just: just?.trim() || undefined,
      evid: evidenceRefs[qId]?.trim() || undefined,
    });
  };

  const handleSubmitAssessment = () => {
    if (
      confirm(
        'Submit completed assessment for formal review? Answers will be locked until an analyst reviews your submission.'
      )
    ) {
      submitMutation.mutate();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/assessments')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Dashboard
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Vendor Response Portal
              </h1>
              <AssessmentStatusBadge status={assessment.status} />
              {isLocked && (
                <Badge variant="neutral" size="sm">
                  <Lock className="h-3 w-3 mr-1" /> Locked
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assessing entity:{' '}
              <span className="font-semibold text-slate-800">{assessment.vendor_name}</span> •{' '}
              {assessment.template_title}
            </p>
          </div>
        </div>

        {/* Progress & Submit Action */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Audit Completion
            </span>
            <span className="text-sm font-bold text-slate-900">
              {assessment.completion_percentage}% Answered
            </span>
          </div>

          {!isLocked ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmitAssessment}
              isLoading={submitMutation.isPending}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Submit Assessment
            </Button>
          ) : (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
              Responses Submitted & Locked
            </span>
          )}
        </div>
      </div>

      {activeError && (
        <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          {activeError}
        </div>
      )}

      {saveSuccessMsg && (
        <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {/* Questions Listing */}
      <div className="space-y-4">
        {template.questions.map((q, idx) => {
          const currentVal = responses[q.id] || '';
          const currentJust = justifications[q.id] || '';
          const currentEvid = evidenceRefs[q.id] || '';
          const isAnswered = !!assessment.answers.find((a) => a.question_id === q.id);
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
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
                    </Badge>
                  )}
                  {q.is_mandatory && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Mandatory
                    </span>
                  )}
                  {q.requires_evidence && (
                    <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <FileCheck2 className="h-3 w-3" /> Artifact Required
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

              {/* Answering Controls */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {q.question_type === 'choice_partial' ? (
                  <div className="flex flex-wrap gap-2">
                    {['Yes', 'Partial', 'No', 'N/A'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        disabled={isLocked}
                        onClick={() =>
                          setResponses((prev) => ({ ...prev, [q.id]: opt.toLowerCase() }))
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                          currentVal.toLowerCase() === opt.toLowerCase()
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-60'
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
                        disabled={isLocked}
                        onClick={() =>
                          setResponses((prev) => ({ ...prev, [q.id]: opt.toLowerCase() }))
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                          currentVal.toLowerCase() === opt.toLowerCase()
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-60'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    placeholder="Enter written assessment response..."
                    value={currentVal}
                    onChange={(e) =>
                      setResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    className="w-full text-xs p-2 rounded border border-slate-300 disabled:bg-slate-50"
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
                      disabled={isLocked}
                      placeholder="Explain why this control is not applicable or what alternative security safeguards exist..."
                      value={currentJust}
                      onChange={(e) =>
                        setJustifications((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="w-full text-xs p-2 rounded border border-amber-300 bg-white disabled:bg-slate-50"
                    />
                  </div>
                )}

                {/* Evidence Pointer Input & Save Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                  <Input
                    disabled={isLocked}
                    placeholder="Evidence Reference / Document ID (optional)"
                    value={currentEvid}
                    onChange={(e) =>
                      setEvidenceRefs((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    leftIcon={<FileText className="h-3.5 w-3.5" />}
                  />

                  {!isLocked && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveQuestion(q.id)}
                        isLoading={saveMutation.isPending}
                        leftIcon={<Save className="h-3.5 w-3.5" />}
                      >
                        Save Draft Response
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
