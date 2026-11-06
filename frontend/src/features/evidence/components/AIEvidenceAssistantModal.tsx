import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/common/FeedbackStates';
import { aiService, AIEvidenceInsight } from '@/services/aiService';

interface AIEvidenceAssistantModalProps {
  evidenceId: string;
  fileName: string;
  onClose: () => void;
}

export const AIEvidenceAssistantModal: React.FC<AIEvidenceAssistantModalProps> = ({
  evidenceId,
  fileName,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedControls, setSelectedControls] = useState<string[]>([]);

  const { data: insight, isLoading } = useQuery<AIEvidenceInsight | null>({
    queryKey: ['ai_evidence_insight', evidenceId],
    queryFn: () => aiService.getInsights(evidenceId),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => aiService.analyzeEvidence(evidenceId),
    onSuccess: (data) => {
      queryClient.setQueryData(['ai_evidence_insight', evidenceId], data);
      setSelectedControls(data.suggested_mappings.map((m) => m.control_code));
    },
  });

  const decisionMutation = useMutation({
    mutationFn: ({ decision, controls }: { decision: 'approve' | 'reject'; controls?: string[] }) =>
      aiService.recordDecision(evidenceId, insight!.id, {
        decision,
        selected_control_codes: controls,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_evidence_insight', evidenceId] });
      queryClient.invalidateQueries({ queryKey: ['evidence_list'] });
      queryClient.invalidateQueries({ queryKey: ['assessment_control_results'] });
    },
  });

  const handleApprove = () => {
    decisionMutation.mutate({ decision: 'approve', controls: selectedControls });
  };

  const handleReject = () => {
    decisionMutation.mutate({ decision: 'reject' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">AI Evidence Intelligence Assistant</h3>
              <p className="text-xs text-slate-500 font-mono">{fileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {isLoading || analyzeMutation.isPending ? (
            <LoadingState message="Extracting text features, citations, and security control associations..." />
          ) : !insight ? (
            <div className="text-center py-12 space-y-3">
              <Sparkles className="h-10 w-10 text-indigo-400 mx-auto" />
              <h4 className="text-base font-semibold text-slate-900">No AI analysis executed yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trigger high-assurance document summarization, control mapping suggestions, and vendor claim discrepancy checks.
              </p>
              <Button onClick={() => analyzeMutation.mutate()} leftIcon={<Sparkles className="h-4 w-4" />}>
                Run AI Intelligence Analysis
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Analyst Review Status:</span>
                  <Badge
                    variant={
                      insight.decision === 'approved'
                        ? 'success'
                        : insight.decision === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {insight.decision.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500">
                  Model Confidence: <span className="font-bold text-slate-800">{Math.round(insight.confidence_score * 100)}%</span>
                </div>
              </div>

              {/* Document Summary */}
              <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-1">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> AI Extracted Executive Summary
                </span>
                <p className="text-xs text-indigo-950 leading-relaxed">{insight.summary}</p>
              </div>

              {/* Vendor Claim Discrepancies */}
              {insight.discrepancies.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-amber-600" /> Vendor Claim vs. Evidence Verification
                  </span>
                  <div className="space-y-2">
                    {insight.discrepancies.map((disc, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                          disc.discrepancy_level === 'direct_contradiction'
                            ? 'bg-rose-50 border-rose-200 text-rose-950'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>Claim: {disc.vendor_claim}</span>
                          <Badge variant={disc.discrepancy_level === 'direct_contradiction' ? 'danger' : 'success'}>
                            {disc.discrepancy_level.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-[11px] opacity-90"><span className="font-bold">Fact:</span> {disc.evidence_fact}</div>
                        <div className="text-[11px] italic opacity-80">{disc.analysis}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Control Mappings */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-brand-600" /> Suggested Control Associations ({insight.suggested_mappings.length})
                </span>
                <div className="space-y-2">
                  {insight.suggested_mappings.map((m) => (
                    <div
                      key={m.control_code}
                      className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedControls.includes(m.control_code)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedControls([...selectedControls, m.control_code]);
                              } else {
                                setSelectedControls(selectedControls.filter((c) => c !== m.control_code));
                              }
                            }}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {m.control_code}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{m.control_title}</span>
                        </label>
                        <span className="text-[11px] font-mono text-slate-500">
                          Relevance: {Math.round(m.relevance_score * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/60 font-mono text-[11px]">
                        "{m.citation}"
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{m.rationale}</span>
                        {m.page_reference && <span className="font-medium text-slate-600">{m.page_reference}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Human-in-the-Loop Decision Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 flex-shrink-0">
          <div className="text-[11px] text-slate-400">
            Human analyst approval is required to associate suggestions.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {insight && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  isLoading={decisionMutation.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  Dismiss AI Suggestions
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  isLoading={decisionMutation.isPending}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Approve & Link ({selectedControls.length})
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
