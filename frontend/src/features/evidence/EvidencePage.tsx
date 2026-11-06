import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIEvidenceAssistantModal } from './components/AIEvidenceAssistantModal';
import {
  FileCheck,
  UploadCloud,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Eye,
  Clock,
  Shield,
  FileText,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import { evidenceService, EvidenceItem, EvidenceReviewPayload } from '@/services/evidenceService';
import { vendorService } from '@/services/vendorService';
import { VendorEntity } from '@/types';

export const EvidencePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadVendorId, setUploadVendorId] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiEvidence, setAiEvidence] = useState<EvidenceItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState<string>('insufficient_detail');
  const [rejectionComment, setRejectionComment] = useState<string>('');

  // Queries
  const { data: vendors } = useQuery<VendorEntity[]>({
    queryKey: ['vendors_list'],
    queryFn: () => vendorService.getVendors(),
  });

  const {
    data: evidenceList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['evidence_list', statusFilter, selectedVendor],
    queryFn: () =>
      evidenceService.list({
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        vendor_id: selectedVendor !== 'all' ? selectedVendor : undefined,
      }),
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => evidenceService.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence_list'] });
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadVendorId('');
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.detail || 'Failed to upload and scan evidence.');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EvidenceReviewPayload }) =>
      evidenceService.review(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence_list'] });
      setIsReviewOpen(false);
      setSelectedEvidence(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => evidenceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence_list'] });
      if (selectedEvidence) setSelectedEvidence(null);
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!uploadVendorId) {
      setUploadError('Please associate the evidence with a vendor.');
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('vendor_id', uploadVendorId);
    uploadMutation.mutate(formData);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence) return;
    reviewMutation.mutate({
      id: selectedEvidence.id,
      payload: {
        action: reviewAction,
        rejection_reason: reviewAction === 'reject' ? rejectionReason : undefined,
        rejection_comment: reviewAction === 'reject' ? rejectionComment : undefined,
      },
    });
  };

  const filteredEvidence = (evidenceList || []).filter((item) => {
    const matchesSearch =
      item.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.vendor_name && item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.sha256_hash.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: EvidenceItem['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </Badge>
        );
      case 'quarantined':
        return (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Quarantined
          </Badge>
        );
      case 'scanning':
        return (
          <Badge variant="info" className="gap-1">
            <Clock className="h-3.5 w-3.5" /> Scanning
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-brand-600" />
            Evidence & Document Vault
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Secure, audited repository for SOC 2 reports, ISO certificates, pentests, and compliance artifacts.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          leftIcon={<UploadCloud className="h-4 w-4" />}
          className="shadow-sm"
        >
          Upload Evidence
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by file name, vendor, or SHA-256 hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter evidence by processing status"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="quarantined">Quarantined</option>
            <option value="rejected">Rejected</option>
            <option value="scanning">Scanning</option>
          </select>

          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            aria-label="Filter evidence by associated vendor"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Vendors</option>
            {vendors?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table / Grid */}
      {isLoading ? (
        <LoadingState message="Loading secure evidence documents..." />
      ) : error ? (
        <ErrorState message="Failed to load evidence vault." />
      ) : filteredEvidence.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <FileCheck className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No evidence documents found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Upload compliance documents, SOC 2 reports, or certification records for antivirus scanning and analyst review.
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>
            Upload Document
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Artifact Name</th>
                  <th className="px-5 py-3.5">Vendor</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">SHA-256 Fingerprint</th>
                  <th className="px-5 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 bg-white">
                {filteredEvidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
                          {ev.file_name.endsWith('.pdf') ? (
                            <FileText className="h-5 w-5" />
                          ) : (
                            <FileCode className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 hover:text-brand-600 cursor-pointer" onClick={() => setSelectedEvidence(ev)}>
                            {ev.file_name}
                          </div>
                          <div className="text-xs text-slate-500">{ev.mime_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {ev.vendor_name || 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">
                      {formatBytes(ev.file_size)}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(ev.status)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {ev.sha256_hash.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAiEvidence(ev);
                            setIsAIOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="AI Evidence Intelligence"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvidence(ev)}
                          title="View Details & Scan Report"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEvidence(ev);
                            setIsReviewOpen(true);
                          }}
                          title="Review / Rejection Decision"
                        >
                          <Shield className="h-4 w-4 text-brand-600" />
                        </Button>
                        {ev.status !== 'rejected' && (
                          <a
                            href={evidenceService.downloadUrl(ev.id)}
                            download
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100"
                            title="Download Verified File"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete evidence '${ev.file_name}'?`)) {
                              deleteMutation.mutate(ev.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Delete Artifact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-brand-600" />
                Upload Compliance Evidence
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="p-3 text-xs bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Vendor *
                </label>
                <select
                  value={uploadVendorId}
                  onChange={(e) => setUploadVendorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                  required
                >
                  <option value="">Select vendor...</option>
                  {vendors?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.criticality})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document Artifact (PDF, DOCX, XLSX, CSV, TXT) *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-brand-400 transition-colors">
                  <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx,.csv,.txt"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Files are scanned for viruses, macro payloads, and format validity before quarantine promotion (Max 25MB).
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={uploadMutation.isPending}>
                  Scan & Upload
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewOpen && selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-600" />
                Analyst Evidence Review
              </h3>
              <button onClick={() => setIsReviewOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div><span className="font-medium text-slate-600">File:</span> {selectedEvidence.file_name}</div>
              <div><span className="font-medium text-slate-600">Vendor:</span> {selectedEvidence.vendor_name}</div>
              <div><span className="font-medium text-slate-600">SHA-256:</span> <code className="text-slate-700">{selectedEvidence.sha256_hash}</code></div>
              <div><span className="font-medium text-slate-600">Scan:</span> {selectedEvidence.scan_result || 'Clean'}</div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('approve')}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      reviewAction === 'approve'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approve Artifact
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('reject')}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      reviewAction === 'reject'
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-red-600" /> Reject Artifact
                  </button>
                </div>
              </div>

              {reviewAction === 'reject' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Rejection Reason Code *
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="insufficient_detail">Insufficient Detail / Incomplete Scope</option>
                      <option value="expired_certificate">Expired Certificate / Outdated Audit Period</option>
                      <option value="tampered_or_corrupt">Tampered or Corrupt File</option>
                      <option value="unauthorized_scope">Unauthorized Scope / Wrong Vendor Entity</option>
                      <option value="other">Other Defect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Rejection Notes / Remediation Request
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionComment}
                      onChange={(e) => setRejectionComment(e.target.value)}
                      placeholder="Specify required corrections for vendor respondent..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={reviewMutation.isPending}>
                  Record Decision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details & Safe Preview Modal */}
      {selectedEvidence && !isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-slate-900">{selectedEvidence.file_name}</h3>
              </div>
              <button onClick={() => setSelectedEvidence(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Status:</span>
                <div className="mt-1">{getStatusBadge(selectedEvidence.status)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Vendor:</span>
                <div className="mt-1 font-medium text-slate-800">{selectedEvidence.vendor_name || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">File Size:</span>
                <div className="mt-1 font-mono text-slate-800">{formatBytes(selectedEvidence.file_size)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">MIME Type:</span>
                <div className="mt-1 text-slate-800">{selectedEvidence.mime_type}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs">
              <span className="font-semibold text-slate-500">Cryptographic SHA-256 Hash:</span>
              <div className="mt-1 font-mono text-slate-800 break-all select-all">{selectedEvidence.sha256_hash}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs">
              <span className="font-semibold text-slate-500">Antivirus / Heuristic Scanner Report:</span>
              <div className="mt-1 text-slate-800 font-medium">{selectedEvidence.scan_result || 'Clean - Signature OK'}</div>
            </div>

            {selectedEvidence.extracted_text_preview && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <span className="font-semibold text-slate-500">Document Text Provenance Preview:</span>
                <div className="p-2 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-700 max-h-36 overflow-y-auto">
                  {selectedEvidence.extracted_text_preview}
                </div>
              </div>
            )}

            {selectedEvidence.rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1 text-red-800">
                <span className="font-semibold">Rejection Reason:</span> {selectedEvidence.rejection_reason}
                {selectedEvidence.rejection_comment && (
                  <div className="mt-1 text-red-700 italic">"{selectedEvidence.rejection_comment}"</div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsReviewOpen(true)}
                  leftIcon={<Shield className="h-4 w-4" />}
                >
                  Review Artifact
                </Button>
                {selectedEvidence.status !== 'rejected' && (
                  <a
                    href={evidenceService.downloadUrl(selectedEvidence.id)}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedEvidence(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* AI Assistant Modal */}
      {isAIOpen && aiEvidence && (
        <AIEvidenceAssistantModal
          evidenceId={aiEvidence.id}
          fileName={aiEvidence.file_name}
          onClose={() => {
            setIsAIOpen(false);
            setAiEvidence(null);
          }}
        />
      )}
    </div>
  );
};
