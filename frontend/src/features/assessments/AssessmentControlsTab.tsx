import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Shield,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/common/FeedbackStates';
import { controlService, ControlAssessmentResult } from '@/services/controlService';
import { evidenceService } from '@/services/evidenceService';

interface AssessmentControlsTabProps {
  assessmentId: string;
  vendorId: string;
}

export const AssessmentControlsTab: React.FC<AssessmentControlsTabProps> = ({
  assessmentId,
  vendorId,
}) => {
  const queryClient = useQueryClient();
  const [evaluatingControl, setEvaluatingControl] = useState<any | null>(null);
  const [selectedEffectiveness, setSelectedEffectiveness] = useState<string>('effective');
  const [evalRationale, setEvalRationale] = useState<string>('');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);

  // 1. Controls list
  const { data: controls } = useQuery({
    queryKey: ['security_controls_list'],
    queryFn: () => controlService.listControls(),
  });

  // 2. Assessment results
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['assessment_control_results', assessmentId],
    queryFn: () => controlService.getAssessmentResults(assessmentId),
  });

  // 3. Coverage metrics
  const { data: coverage } = useQuery({
    queryKey: ['assessment_framework_coverage', assessmentId],
    queryFn: () => controlService.getCoverage(assessmentId),
  });

  // 4. Approved vendor evidence for linking
  const { data: vendorEvidence } = useQuery({
    queryKey: ['vendor_evidence_approved', vendorId],
    queryFn: () => evidenceService.list({ vendor_id: vendorId, status_filter: 'approved' }),
  });

  // Evaluation mutation
  const evaluateMutation = useMutation({
    mutationFn: (payload: { controlId: string; effectiveness: string; rationale: string; evidence_ids: string[] }) =>
      controlService.evaluateControl(assessmentId, payload.controlId, {
        effectiveness: payload.effectiveness,
        rationale: payload.rationale,
        evidence_ids: payload.evidence_ids,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment_control_results', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment_framework_coverage', assessmentId] });
      setEvaluatingControl(null);
    },
  });

  const resultMap = new Map<string, ControlAssessmentResult>();
  (results || []).forEach((r) => {
    resultMap.set(r.control_id, r);
  });

  const handleOpenEvaluate = (ctrl: any) => {
    const existing = resultMap.get(ctrl.id);
    setEvaluatingControl(ctrl);
    setSelectedEffectiveness(existing ? existing.effectiveness : 'effective');
    setEvalRationale(existing?.rationale || '');
    setSelectedEvidenceIds(existing?.associated_evidence_ids || []);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingControl) return;
    evaluateMutation.mutate({
      controlId: evaluatingControl.id,
      effectiveness: selectedEffectiveness,
      rationale: evalRationale,
      evidence_ids: selectedEvidenceIds,
    });
  };

  const getEffectivenessBadge = (eff?: string) => {
    switch (eff) {
      case 'effective':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Effective
          </Badge>
        );
      case 'partially_effective':
        return (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Partially Effective
          </Badge>
        );
      case 'ineffective':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="h-3 w-3" /> Ineffective
          </Badge>
        );
      case 'not_applicable':
        return (
          <Badge variant="neutral" className="gap-1">
            <HelpCircle className="h-3 w-3" /> Not Applicable
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="gap-1 text-slate-400 bg-slate-100">
            Unassessed
          </Badge>
        );
    }
  };

  if (resultsLoading) {
    return <LoadingState message="Loading security control assessment matrix..." />;
  }

  return (
    <div className="space-y-6">
      {/* Real-time Framework Coverage Visualizer */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Shield className="h-4 w-4 text-brand-600" />
          Framework Compliance & Control Coverage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coverage?.map((cov) => (
            <div key={cov.framework_name} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">{cov.framework_name}</span>
                <span className="font-bold text-xs text-brand-700">{cov.coverage_percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${cov.coverage_percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>{cov.evaluated_controls}/{cov.total_controls} Controls Evaluated</span>
                <span className="text-emerald-600 font-medium">{cov.effective_controls} Effective</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Assessment Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-600" />
            Control Effectiveness Evaluations
          </h3>
          <span className="text-xs text-slate-500">
            {results?.length || 0} evaluated controls
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Security Control</th>
                <th className="px-5 py-3.5">Effectiveness</th>
                <th className="px-5 py-3.5">Substantiating Evidence</th>
                <th className="px-5 py-3.5">Evaluator</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {(controls || []).map((ctrl) => {
                const res = resultMap.get(ctrl.id);
                return (
                  <tr key={ctrl.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                        {ctrl.code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{ctrl.title}</div>
                      <div className="text-xs text-slate-500">{ctrl.domain}</div>
                    </td>
                    <td className="px-5 py-4">
                      {getEffectivenessBadge(res?.effectiveness)}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {res && res.associated_evidence_ids.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                          {res.associated_evidence_ids.length} artifact(s) linked
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {res?.evaluator_email ? (
                        <div>
                          <div>{res.evaluator_email}</div>
                          <div className="text-[10px] text-slate-400">
                            {res.reviewed_at ? new Date(res.reviewed_at).toLocaleDateString() : ''}
                          </div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEvaluate(ctrl)}
                      >
                        {res ? 'Update' : 'Evaluate'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluate Control Modal */}
      {evaluatingControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-600" />
                Evaluate Control: {evaluatingControl.code}
              </h3>
              <button
                onClick={() => setEvaluatingControl(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-900">{evaluatingControl.title}</div>
              <div className="text-slate-600">{evaluatingControl.description}</div>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Effectiveness Assessment *
                </label>
                <select
                  value={selectedEffectiveness}
                  onChange={(e) => setSelectedEffectiveness(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="effective">Effective (Meets all control objectives)</option>
                  <option value="partially_effective">Partially Effective (Minor gaps/exceptions noted)</option>
                  <option value="ineffective">Ineffective (Critical control failure or absent)</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Evaluation Rationale & Findings
                </label>
                <textarea
                  rows={3}
                  value={evalRationale}
                  onChange={(e) => setEvalRationale(e.target.value)}
                  placeholder="Record auditor notes, compensating controls, or gap justifications..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Associate Approved Evidence Artifacts
                </label>
                {vendorEvidence && vendorEvidence.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50">
                    {vendorEvidence.map((ev) => (
                      <label key={ev.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedEvidenceIds.includes(ev.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvidenceIds([...selectedEvidenceIds, ev.id]);
                            } else {
                              setSelectedEvidenceIds(selectedEvidenceIds.filter((id) => id !== ev.id));
                            }
                          }}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="font-medium text-slate-900">{ev.file_name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({ev.sha256_hash.substring(0, 8)})</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No approved evidence artifacts for this vendor yet.</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setEvaluatingControl(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={evaluateMutation.isPending}>
                  Save Evaluation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
