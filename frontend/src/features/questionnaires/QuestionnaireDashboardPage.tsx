import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { questionnaireService } from '@/services/questionnaireService';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/FeedbackStates';
import { TemplateBuilderModal } from './components/TemplateBuilderModal';
import { AssignmentModal } from './components/AssignmentModal';
import {
  FileQuestion,
  Plus,
  Send,
  Eye,
} from 'lucide-react';

export const QuestionnaireDashboardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('assessment:write');

  const [activeTab, setActiveTab] = useState<'templates' | 'assignments'>('templates');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Templates query
  const {
    data: templates,
    isLoading: isTemplatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ['questionnaire_templates'],
    queryFn: () => questionnaireService.getTemplates(),
  });

  // Dispatched assignments query
  const {
    data: assignments,
    isLoading: isAssignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ['questionnaire_assignments'],
    queryFn: () => questionnaireService.getAssignments(),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Security Questionnaire Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build standardized, reusable framework templates and dispatch audit cycles to vendor representatives.
          </p>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAssignOpen(true)}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Dispatch Audit
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsBuilderOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Template
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileQuestion className="h-4 w-4" />
          Reusable Templates ({templates?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'assignments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="h-4 w-4" />
          Dispatched Assessments ({assignments?.length || 0})
        </button>
      </div>

      {/* Tab 1: Templates View */}
      {activeTab === 'templates' && (
        <>
          {isTemplatesLoading ? (
            <LoadingState message="Loading questionnaire library..." />
          ) : templatesError ? (
            <ErrorState message="Failed to load templates." onRetry={() => refetchTemplates()} />
          ) : templates && templates.length === 0 ? (
            <EmptyState
              title="No Templates Defined"
              description="Create your first questionnaire template to start evaluating vendor cybersecurity safeguards."
              actionLabel={canWrite ? "Build Template" : undefined}
              onAction={() => setIsBuilderOpen(true)}
              icon={<FileQuestion className="h-8 w-8 text-slate-400" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates?.map((t) => (
                <Card key={t.id} className="flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        v{t.version}
                      </span>
                      <Badge
                        variant={t.status === 'published' ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {t.status.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {t.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Framework: {t.framework_tag}
                    </p>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {t.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      {t.questions.length} Questions
                    </span>

                    <div className="flex items-center gap-2">
                      <Link to={`/questionnaires/templates/${t.id}`}>
                        <Button variant="outline" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>
                          Inspect
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Dispatched Assessments View */}
      {activeTab === 'assignments' && (
        <>
          {isAssignmentsLoading ? (
            <LoadingState message="Loading vendor assessment tracking..." />
          ) : assignmentsError ? (
            <ErrorState message="Failed to load assignments." onRetry={() => refetchAssignments()} />
          ) : assignments && assignments.length === 0 ? (
            <EmptyState
              title="No Dispatched Questionnaires"
              description="Dispatch questionnaire cycles to vendors to collect compliance evidence."
              actionLabel={canWrite ? "Dispatch Assessment" : undefined}
              onAction={() => setIsAssignOpen(true)}
              icon={<Send className="h-8 w-8 text-slate-400" />}
            />
          ) : (
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Vendor Target</TableHead>
                    <TableHead>Template / Version</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {assignments?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <span className="font-bold text-slate-900 block">{a.vendor_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Assigned {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-medium text-slate-800 block">
                          {a.template_title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Template v{a.template_version} snapshot
                        </span>
                      </TableCell>

                      <TableCell className="text-xs font-mono text-slate-600">
                        {a.assigned_to_email || 'Unassigned'}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 w-32">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-brand-600 h-full rounded-full"
                              style={{ width: `${a.completion_percentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-600">
                            {a.completion_percentage}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            a.status === 'completed'
                              ? 'success'
                              : a.status === 'in_progress'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {a.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Link to={`/questionnaires/assignments/${a.id}`}>
                          <Button variant="outline" size="sm">
                            Open Audit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {/* Modals */}
      <TemplateBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={() => refetchTemplates()}
      />

      <AssignmentModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={() => refetchAssignments()}
      />
    </div>
  );
};
