import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/common/FeedbackStates';
import { assessmentService } from '@/services/assessmentService';
import { reportService, ReportItem } from '@/services/reportAndMonitoringService';

export const ReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [reportType, setReportType] = useState('executive');

  const { data: assessments } = useQuery({
    queryKey: ['assessments_list'],
    queryFn: () => assessmentService.getAssessments(),
  });

  const { data: reports, isLoading } = useQuery<ReportItem[]>({
    queryKey: ['reports_list'],
    queryFn: () => reportService.listReports(),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      reportService.generateReport({
        assessment_id: selectedAssessmentId,
        report_type: reportType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports_list'] });
      setIsGenerateOpen(false);
      setSelectedAssessmentId('');
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentId) return;
    generateMutation.mutate();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-brand-600" />
            Audit Reports & Assessment Snapshots
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Immutable, cryptographically hashed executive dossiers and technical findings reports.
          </p>
        </div>

        <Button
          onClick={() => setIsGenerateOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          className="shadow-sm"
        >
          Generate Report
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading immutable report archive..." />
      ) : reports?.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl space-y-3">
          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900">No Assessment Reports Generated</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Generate formal executive briefings or technical gap dossiers frozen with verifiable SHA-256 signatures.
          </p>
          <Button onClick={() => setIsGenerateOpen(true)} variant="outline" size="sm">
            Generate First Report
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Report Title</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">File Size</th>
                  <th className="px-5 py-3.5">Cryptographic SHA-256 Hash</th>
                  <th className="px-5 py-3.5">Auditor / Date</th>
                  <th className="px-5 py-3.5 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 bg-white">
                {reports?.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{rep.title}</div>
                          <div className="text-xs text-slate-400 font-mono">Snapshot v{rep.version}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={rep.report_type === 'executive' ? 'info' : 'neutral'}>
                        {rep.report_type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {formatBytes(rep.file_size)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {rep.sha256_hash.substring(0, 14)}...
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <div className="text-slate-700 font-medium">{rep.generated_by}</div>
                      <div>{new Date(rep.generated_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={reportService.downloadUrl(rep.id)}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generation Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" />
                Generate Risk Assessment Report
              </h3>
              <button onClick={() => setIsGenerateOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Assessment *
                </label>
                <select
                  required
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Select assessment...</option>
                  {assessments?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.vendor_name} — {a.scope} ({a.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Report Template Dossier *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReportType('executive')}
                    className={`p-3 rounded-lg border text-left text-xs space-y-1 transition-all ${
                      reportType === 'executive'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">Executive Briefing</div>
                    <p className="opacity-80">High-level residual risk bands, scores, and vendor criticality overview.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('technical')}
                    className={`p-3 rounded-lg border text-left text-xs space-y-1 transition-all ${
                      reportType === 'technical'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">Technical Audit</div>
                    <p className="opacity-80">Comprehensive control gap findings, evidence hashes, and remediations.</p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setIsGenerateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={generateMutation.isPending}>
                  Compile PDF Snapshot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
