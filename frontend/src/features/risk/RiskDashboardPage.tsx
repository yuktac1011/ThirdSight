import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Calculator,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/common/FeedbackStates';
import { assessmentService } from '@/services/assessmentService';
import { riskService, RiskScore, Finding } from '@/services/riskService';

export const RiskDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // Remediation Modal State
  const [isRemediationOpen, setIsRemediationOpen] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remPlan, setRemPlan] = useState('');
  const [remOwner, setRemOwner] = useState('');
  const [remDue, setRemDue] = useState('');

  // Risk Acceptance Modal State
  const [isAcceptanceOpen, setIsAcceptanceOpen] = useState(false);
  const [accRationale, setAccRationale] = useState('');
  const [accControls, setAccControls] = useState('');
  const [accExpires, setAccExpires] = useState('');

  // 1. Fetch assessments
  const { data: assessments, isLoading: isAssessmentsLoading } = useQuery({
    queryKey: ['assessments_list'],
    queryFn: () => assessmentService.getAssessments(),
  });

  const activeAssessmentId = selectedAssessmentId || (assessments && assessments.length > 0 ? assessments[0].id : '');

  // 2. Fetch risk score for active assessment
  const { data: riskScore, isLoading: isRiskLoading } = useQuery<RiskScore | null>({
    queryKey: ['assessment_risk_score', activeAssessmentId],
    queryFn: () => (activeAssessmentId ? riskService.getAssessmentRisk(activeAssessmentId) : null),
    enabled: !!activeAssessmentId,
  });

  // 3. Fetch security findings
  const { data: findings } = useQuery<Finding[]>({
    queryKey: ['assessment_findings', activeAssessmentId],
    queryFn: () => (activeAssessmentId ? riskService.getFindings(activeAssessmentId) : []),
    enabled: !!activeAssessmentId,
  });

  // Calculate Mutation
  const calculateMutation = useMutation({
    mutationFn: () => riskService.calculateRisk(activeAssessmentId),
    onSuccess: (data) => {
      queryClient.setQueryData(['assessment_risk_score', activeAssessmentId], data);
      queryClient.invalidateQueries({ queryKey: ['assessment_findings', activeAssessmentId] });
    },
  });

  // Remediation Mutation
  const createRemediationMutation = useMutation({
    mutationFn: (payload: { title: string; action_plan: string; owner_email: string; due_date: string }) =>
      riskService.createRemediation(selectedFinding!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment_findings', activeAssessmentId] });
      setIsRemediationOpen(false);
      setRemTitle('');
      setRemPlan('');
      setRemOwner('');
      setRemDue('');
    },
  });

  // Risk Acceptance Mutation
  const acceptRiskMutation = useMutation({
    mutationFn: (payload: { rationale: string; compensating_controls: string; expires_at: string }) =>
      riskService.acceptRisk(selectedFinding!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment_findings', activeAssessmentId] });
      setIsAcceptanceOpen(false);
      setAccRationale('');
      setAccControls('');
      setAccExpires('');
    },
  });

  const handleRemediationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    createRemediationMutation.mutate({
      title: remTitle,
      action_plan: remPlan,
      owner_email: remOwner,
      due_date: new Date(remDue).toISOString(),
    });
  };

  const handleAcceptanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    acceptRiskMutation.mutate({
      rationale: accRationale,
      compensating_controls: accControls,
      expires_at: new Date(accExpires).toISOString(),
    });
  };

  const getRiskBandBadge = (band: string) => {
    switch (band) {
      case 'critical':
        return <Badge variant="danger" dot>CRITICAL</Badge>;
      case 'high':
        return <Badge variant="warning" dot>HIGH</Badge>;
      case 'medium':
        return <Badge variant="info" dot>MEDIUM</Badge>;
      default:
        return <Badge variant="success" dot>LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            <ShieldAlert className="h-7 w-7 text-cyan-400" />
            Deterministic Risk Intelligence & Gap Remediation
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Explainable inherent and residual risk scoring, 5×5 heatmap matrix, and auditable corrective actions.
          </p>
        </div>

        {/* Assessment Selector */}
        <div className="flex items-center gap-3">
          <select
            value={activeAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-sm text-white shadow-subtle focus:border-brand-500 focus:outline-none"
          >
            {assessments?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.vendor_name} ({a.scope})
              </option>
            ))}
          </select>
          <Button
            onClick={() => calculateMutation.mutate()}
            isLoading={calculateMutation.isPending}
            variant="cyber"
            leftIcon={<Calculator className="h-4 w-4" />}
          >
            Calculate Risk
          </Button>
        </div>
      </div>

      {isAssessmentsLoading || isRiskLoading ? (
        <LoadingState message="Loading risk intelligence models..." />
      ) : !riskScore ? (
        <div className="text-center py-16 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl space-y-3 backdrop-blur-md">
          <ShieldAlert className="h-12 w-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Risk Score Calculated</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Execute the deterministic scoring engine to calculate Inherent Risk, evaluate control effectiveness, and compute Residual Risk.
          </p>
          <Button onClick={() => calculateMutation.mutate()} variant="cyber" leftIcon={<Calculator className="h-4 w-4" />}>
            Calculate Risk Now
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Score Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-glass hover:border-slate-700 transition-all">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inherent Risk Score</span>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">{riskScore.inherent_score}</span>
                <span className="text-xs font-semibold text-slate-500">/ 25</span>
                {getRiskBandBadge(riskScore.inherent_band)}
              </div>
              <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                Likelihood ({riskScore.likelihood}) × Impact ({riskScore.impact})
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-glass hover:border-slate-700 transition-all">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Validated Controls</span>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                  {Math.round(riskScore.control_effectiveness_score * 100)}%
                </span>
                <span className="text-xs font-semibold text-slate-500">effectiveness</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                Substantiated via audited evidence
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-glass hover:border-slate-700 transition-all">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Residual Risk Score</span>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-300 tracking-tight">{riskScore.residual_score}</span>
                <span className="text-xs font-semibold text-slate-500">/ 25</span>
                {getRiskBandBadge(riskScore.residual_band)}
              </div>
              <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold pt-2 border-t border-slate-800/80">
                <TrendingDown className="h-3.5 w-3.5" /> Post-mitigation exposure
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-glass hover:border-slate-700 transition-all">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Security Findings</span>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">{findings?.length || 0}</span>
                <span className="text-xs font-medium text-slate-400">gaps identified</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                Requiring corrective action plans
              </p>
            </div>
          </div>

          {/* Explanation Banner */}
          {riskScore.explanation && (
            <div className="p-4 bg-brand-50/40 border border-brand-200/70 rounded-xl text-xs text-slate-800 leading-relaxed">
              <span className="font-bold text-brand-900 block mb-0.5">Methodology Rationale ({riskScore.methodology_version}):</span>
              {riskScore.explanation}
            </div>
          )}

          {/* 5x5 Heatmap Matrix & Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5x5 Risk Matrix */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-glass space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-cyan-400" />
                  5 × 5 TPRM Heatmap Matrix
                </h3>
                <span className="text-xs font-medium text-slate-400">Likelihood vs. Impact</span>
              </div>

              {/* Matrix Grid */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">
                  Likelihood (1 to 5)
                </div>
                {[5, 4, 3, 2, 1].map((rowLikelihood) => (
                  <div key={rowLikelihood} className="flex items-center gap-1.5">
                    <span className="w-5 text-right font-mono text-xs font-semibold text-slate-400">{rowLikelihood}</span>
                    <div className="grid grid-cols-5 gap-1.5 flex-1">
                      {[1, 2, 3, 4, 5].map((colImpact) => {
                        const cellScore = rowLikelihood * colImpact;
                        const isInherent = riskScore.likelihood === rowLikelihood && riskScore.impact === colImpact;

                        // Residual coordinate approximation
                        const isResidual =
                          Math.round(riskScore.residual_score / riskScore.impact) === rowLikelihood &&
                          riskScore.impact === colImpact;

                        let bgClass = 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50';
                        if (cellScore >= 16) bgClass = 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/50';
                        else if (cellScore >= 10) bgClass = 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/50';
                        else if (cellScore >= 5) bgClass = 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/50';

                        return (
                          <div
                            key={colImpact}
                            className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs font-mono font-bold relative transition-all shadow-subtle ${bgClass}`}
                          >
                            <span>{cellScore}</span>
                            {isInherent && (
                              <span
                                className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 bg-rose-600 text-white rounded-md text-[9px] font-sans font-bold shadow-glow-danger"
                                title="Inherent Risk Position"
                              >
                                INH
                              </span>
                            )}
                            {isResidual && (
                              <span
                                className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-cyan-500 text-slate-950 rounded-md text-[9px] font-sans font-extrabold shadow-glow-cyan"
                                title="Residual Risk Position"
                              >
                                RES
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex items-center pl-6 pt-2 text-[10px] font-bold text-slate-400 justify-between uppercase tracking-wider">
                  <span>Impact: 1 (Public)</span>
                  <span>Impact: 3 (Confidential)</span>
                  <span>Impact: 5 (Restricted)</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> Low (1-4)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" /> Medium (5-9)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" /> High (10-15)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_6px_#fb7185]" /> Critical (16-25)
                </span>
              </div>
            </div>

            {/* Inherent vs Residual Delta Visualization */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-glass space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-emerald-400" />
                  Inherent vs. Residual Risk Reduction
                </h3>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Control Mitigation Active
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-300">Inherent Risk (Raw Threat & Connectivity)</span>
                    <span className="font-mono text-white">{riskScore.inherent_score} / 25</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-rose-500 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_#f43f5e]"
                      style={{ width: `${(riskScore.inherent_score / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-300">Residual Risk (After Validated Controls)</span>
                    <span className="font-mono text-cyan-300">{riskScore.residual_score} / 25</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_#06b6d4]"
                      style={{ width: `${(riskScore.residual_score / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white">Reduction Mechanics:</div>
                  <p className="text-slate-400 leading-relaxed">
                    By verifying controls ({Math.round(riskScore.control_effectiveness_score * 100)}% effectiveness),
                    the residual exposure was reduced by{' '}
                    <span className="font-bold text-emerald-400">
                      {Math.max(0, riskScore.inherent_score - riskScore.residual_score)} points
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Findings & Remediation Tracker */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-glass">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Security Gap Findings & Action Plans ({findings?.length || 0})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Controls evaluated as ineffective or partially effective automatically generate actionable findings.
                </p>
              </div>
            </div>

            {findings?.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                No active security findings. All controls validated effectively!
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {findings?.map((f) => (
                  <div key={f.id} className="p-4 space-y-3 hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              f.severity === 'critical' || f.severity === 'high'
                                ? 'danger'
                                : f.severity === 'medium'
                                ? 'warning'
                                : 'neutral'
                            }
                            dot
                          >
                            {f.severity.toUpperCase()}
                          </Badge>
                          <span className="font-bold text-sm text-white">{f.title}</span>
                          <Badge variant="neutral">{f.status.replace('_', ' ').toUpperCase()}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{f.description}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {f.status !== 'accepted' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFinding(f);
                                setIsRemediationOpen(true);
                              }}
                            >
                              Add Remediation
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFinding(f);
                                setIsAcceptanceOpen(true);
                              }}
                              className="text-amber-400 border-amber-500/40 hover:bg-amber-950/40"
                            >
                              Accept Risk
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remediation Tasks List */}
                    {f.remediations.length > 0 && (
                      <div className="pl-4 border-l-2 border-brand-200 space-y-2 mt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Remediation Action Items:
                        </span>
                        {f.remediations.map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded">
                            <div>
                              <span className="font-medium text-slate-900">{r.title}</span>
                              <div className="text-[11px] text-slate-500">{r.action_plan}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-mono">Owner: {r.owner_email}</span>
                              <Badge variant={r.status === 'completed' ? 'success' : 'info'}>{r.status.toUpperCase()}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Risk Acceptance Record */}
                    {f.risk_acceptance && (
                      <div className="pl-4 border-l-2 border-amber-400 bg-amber-50/40 p-2.5 rounded text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">
                            Formal Risk Acceptance Granted by {f.risk_acceptance.approver_email}
                          </span>
                          <span className="text-[11px] text-amber-700">
                            Expires: {new Date(f.risk_acceptance.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-slate-700"><span className="font-medium">Rationale:</span> {f.risk_acceptance.rationale}</div>
                        {f.risk_acceptance.compensating_controls && (
                          <div className="text-slate-600"><span className="font-medium">Compensating Controls:</span> {f.risk_acceptance.compensating_controls}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remediation Modal */}
      {isRemediationOpen && selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Create Remediation Task</h3>
              <button onClick={() => setIsRemediationOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRemediationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="e.g. Enforce MFA across DBA accounts"
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Corrective Action Plan *</label>
                <textarea
                  rows={3}
                  required
                  value={remPlan}
                  onChange={(e) => setRemPlan(e.target.value)}
                  placeholder="Detailed engineering steps and validation criteria..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Owner Email *</label>
                  <input
                    type="email"
                    required
                    value={remOwner}
                    onChange={(e) => setRemOwner(e.target.value)}
                    placeholder="security-lead@company.internal"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">SLA Due Date *</label>
                  <input
                    type="date"
                    required
                    value={remDue}
                    onChange={(e) => setRemDue(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setIsRemediationOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={createRemediationMutation.isPending}>Create Task</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Acceptance Modal */}
      {isAcceptanceOpen && selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Formal Risk Acceptance Sign-Off</h3>
              <button onClick={() => setIsAcceptanceOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAcceptanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Business Rationale *</label>
                <textarea
                  rows={3}
                  required
                  value={accRationale}
                  onChange={(e) => setAccRationale(e.target.value)}
                  placeholder="Justify why residual risk is accepted by delegated leadership..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Compensating Controls</label>
                <textarea
                  rows={2}
                  value={accControls}
                  onChange={(e) => setAccControls(e.target.value)}
                  placeholder="Document alternative guardrails (e.g. enhanced monitoring, network isolation)..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Mandatory Expiration Date *</label>
                <input
                  type="date"
                  required
                  value={accExpires}
                  onChange={(e) => setAccExpires(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setIsAcceptanceOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={acceptRiskMutation.isPending}>Grant Acceptance</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
