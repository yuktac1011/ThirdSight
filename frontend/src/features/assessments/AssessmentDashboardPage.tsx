import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { assessmentService } from '@/services/assessmentService';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/FeedbackStates';
import { AssessmentCreateModal } from './components/AssessmentCreateModal';
import { AssessmentStatusBadge } from './components/AssessmentStatusBadge';
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react';

export const AssessmentDashboardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('assessment:write');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: assessments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assessments', searchTerm, statusFilter],
    queryFn: () =>
      assessmentService.getAssessments({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Vendor Security Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track evaluation lifecycles, respondent submission workflows, audit scores, and analyst approval states.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Assessment
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search assessment scope, vendor, or template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500">Lifecycle Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="initiated">Initiated</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Data Content */}
      {isLoading ? (
        <LoadingState message="Loading vendor security assessments..." />
      ) : error ? (
        <ErrorState message="Failed to fetch assessments." onRetry={() => refetch()} />
      ) : assessments && assessments.length === 0 ? (
        <EmptyState
          title="No Security Assessments"
          description={
            searchTerm || statusFilter
              ? "No assessments match the selected search criteria."
              : "No vendor assessments have been initiated in this tenant organization."
          }
          actionLabel={canCreate ? "Launch First Assessment" : undefined}
          onAction={() => setIsCreateModalOpen(true)}
          icon={<ClipboardCheck className="h-8 w-8 text-slate-400" />}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Vendor & Scope</TableHead>
                <TableHead>Framework Template</TableHead>
                <TableHead>Respondent Contact</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Posture Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {assessments?.map((asm) => (
                <TableRow key={asm.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 block">{asm.vendor_name}</span>
                      {asm.is_locked ? (
                        <span title="Locked (Submitted / Reviewed)">
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                        </span>
                      ) : (
                        <span title="Open for editing">
                          <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 block">{asm.scope}</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Initiated {new Date(asm.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold text-slate-800 block">
                      {asm.template_title}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Cycle Version: v{asm.version}
                    </span>
                  </TableCell>

                  <TableCell className="text-xs font-mono text-slate-600">
                    {asm.assigned_respondent_email || 'Unassigned'}
                    {asm.due_at && (
                      <span className="text-[10px] text-slate-400 block flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" /> Due: {new Date(asm.due_at).toLocaleDateString()}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full"
                          style={{ width: `${asm.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-600">
                        {asm.completion_percentage}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {asm.score !== null && asm.score !== undefined ? (
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
                        {asm.score} / 100
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">Pending Evaluation</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <AssessmentStatusBadge status={asm.status} />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/assessments/${asm.id}`}>
                        <Button variant="outline" size="sm">
                          Inspect
                        </Button>
                      </Link>
                      <Link to={`/assessments/${asm.id}/respond`}>
                        <Button variant="secondary" size="sm">
                          {asm.is_locked ? "View Portal" : "Complete Portal"}
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal */}
      <AssessmentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
