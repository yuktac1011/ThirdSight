import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentService } from '@/services/assessmentService';
import { questionnaireService } from '@/services/questionnaireService';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import { AssessmentStatusBadge } from './components/AssessmentStatusBadge';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  FileText,
  Calendar,
  Lock,
  ExternalLink,
  History,
} from 'lucide-react';

export const AssessmentDetailPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canReview = hasPermission('assessment:write');

  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const {
    data: assessment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['assessment_detail', assessmentId],
    queryFn: () => assessmentService.getAssessmentById(assessmentId!),
    enabled: !!assessmentId,
  });

  const { data: template } = useQuery({
    queryKey: ['template_for_assessment', assessment?.template_id],
    queryFn: () => questionnaireService.getTemplateById(assessment!.template_id),
    enabled: !!assessment?.template_id,
  });

  const reviewMutation = useMutation({
    mutationFn: (action: 'approve' | 'reject' | 'reopen') =>
      assessmentService.reviewAssessment(assessmentId!, {
        action,
        review_notes: reviewNotes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment_detail', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setReviewNotes('');
      setReviewError(null);
    },
    onError: (err: any) => {
      setReviewError(err.response?.data?.detail || 'Failed to update review status.');
    },
  });

  if (isLoading) return <LoadingState message="Loading security assessment dossier..." />;
  if (error || !assessment) return <ErrorState message="Could not find assessment record." />;

  const answersMap = new Map(assessment.answers.map((a) => [a.question_id, a]));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/assessments')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Assessments
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {assessment.scope}
              </h1>
              <AssessmentStatusBadge status={assessment.status} />
              {assessment.is_locked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-brand-600" />
                {assessment.vendor_name}
              </span>
              <span>•</span>
              <span>{assessment.template_title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/assessments/${assessment.id}/respond`}>
            <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
              Open Respondent Portal
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Assessment Score
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {assessment.score !== null && assessment.score !== undefined
                ? `${assessment.score}`
                : 'Pending'}
            </span>
            {assessment.score !== null && <span className="text-xs text-slate-500">/ 100</span>}
          </div>
          <span className="text-[11px] text-slate-400">
            Calculated via deterministic weighted responses
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Respondent SLA
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <Calendar className="h-4 w-4 text-brand-600" />
            {assessment.due_at ? new Date(assessment.due_at).toLocaleDateString() : 'No SLA set'}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {assessment.assigned_respondent_email || 'Unassigned'}
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Response Completion
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {assessment.completion_percentage}%
            </span>
            <span className="text-xs text-slate-500">
              ({assessment.answers.length} controls recorded)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Mandatory controls validated</span>
        </Card>
      </div>

      {/* Main Grid: Controls Review & Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Questions & Recorded Answers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Evaluation Controls & Responses ({template?.questions.length || 0})
            </h3>
          </div>

          {template?.questions.map((q, idx) => {
            const ans = answersMap.get(q.id);

            return (
              <Card key={q.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      #{idx + 1}
                    </span>
                    <Badge variant="default" size="sm">
                      {q.domain}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400">
                      Weight: {q.weight}x
                    </span>
                  </div>

                  {ans ? (
                    <Badge
                      variant={
                        ans.response_value.toLowerCase() === 'yes'
                          ? 'success'
                          : ans.response_value.toLowerCase() === 'partial'
                          ? 'warning'
                          : ans.response_value.toLowerCase() === 'no'
                          ? 'danger'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {ans.response_value.toUpperCase()}
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      UNANSWERED
                    </Badge>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {q.text}
                </p>

                {ans?.justification && (
                  <div className="mt-2.5 rounded bg-slate-50 p-2.5 border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Respondent Justification:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{ans.justification}</p>
                  </div>
                )}

                {ans?.evidence_reference && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-700 font-mono">
                    <FileText className="h-3.5 w-3.5 text-brand-600" />
                    <span>Evidence Reference: {ans.evidence_reference}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Right: SecOps Review & Audit Trail */}
        <div className="space-y-6">
          {/* Analyst Review Action Card */}
          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Analyst Review & Sign-Off</CardTitle>
                <CardDescription>
                  Formal security decision and lifecycle transitions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewError && (
                  <div className="rounded bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Review Findings & Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter analyst justification for approval, rejection, or required remediations..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => reviewMutation.mutate('approve')}
                      isLoading={reviewMutation.isPending}
                      leftIcon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    >
                      Approve Audit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => reviewMutation.mutate('reject')}
                      isLoading={reviewMutation.isPending}
                      leftIcon={<XCircle className="h-4 w-4" />}
                    >
                      Reject Audit
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reviewMutation.mutate('reopen')}
                    isLoading={reviewMutation.isPending}
                    leftIcon={<RotateCcw className="h-4 w-4 text-amber-600" />}
                  >
                    Reopen for Revisions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <History className="h-4 w-4 text-slate-500" />
                Audit Trail & History
              </CardTitle>
              <CardDescription>Immutable record of status transitions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-mb-4 divide-y divide-slate-100">
                  {assessment.history?.map((h) => (
                    <li key={h.id} className="py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase">
                          {h.to_status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        By: {h.actor_email}
                      </p>
                      {h.comment && (
                        <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                          {h.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
