import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assessmentService } from '@/services/assessmentService';
import { vendorService } from '@/services/vendorService';
import { questionnaireService } from '@/services/questionnaireService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface AssessmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVendorId?: string;
  onSuccess?: () => void;
}

export const AssessmentCreateModal: React.FC<AssessmentCreateModalProps> = ({
  isOpen,
  onClose,
  preselectedVendorId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [vendorId, setVendorId] = useState(preselectedVendorId || '');
  const [templateId, setTemplateId] = useState('');
  const [scope, setScope] = useState('Annual Vendor Cybersecurity Review');
  const [dueAt, setDueAt] = useState('');
  const [assignedEmail, setAssignedEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedVendorId) setVendorId(preselectedVendorId);
  }, [preselectedVendorId]);

  const { data: vendors } = useQuery({
    queryKey: ['vendors_dropdown_assessment'],
    queryFn: () => vendorService.getVendors(),
    enabled: isOpen,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates_dropdown_assessment'],
    queryFn: () => questionnaireService.getTemplates({ status: 'published' }),
    enabled: isOpen,
  });

  const handleVendorSelect = (vId: string) => {
    setVendorId(vId);
    const chosen = vendors?.find((v) => v.id === vId);
    if (chosen && chosen.contacts.length > 0) {
      setAssignedEmail(chosen.contacts[0].email);
    } else {
      setAssignedEmail('');
    }
  };

  const createMutation = useMutation({
    mutationFn: assessmentService.createAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to initiate assessment.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vendorId) {
      setErrorMsg('Please select a target third-party vendor.');
      return;
    }
    if (!templateId) {
      setErrorMsg('Please select a published questionnaire template.');
      return;
    }

    createMutation.mutate({
      vendor_id: vendorId,
      template_id: templateId,
      scope: scope.trim() || 'Annual Vendor Risk Audit',
      due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
      assigned_respondent_email: assignedEmail.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Vendor Security Assessment"
      description="Launch a formal compliance assessment cycle linked to an approved questionnaire framework."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Third-Party Vendor Entity *
          </label>
          <select
            required
            value={vendorId}
            onChange={(e) => handleVendorSelect(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">-- Choose Vendor to Assess --</option>
            {vendors?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.criticality.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Questionnaire Framework Template *
          </label>
          <select
            required
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">-- Choose Framework Template --</option>
            {templates?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} (v{t.version}) [{t.framework_tag}]
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Assessment Scope & Objective"
            required
            placeholder="e.g. Annual SOC 2 Type II Evaluation"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Assigned Respondent Contact"
            type="email"
            placeholder="compliance@supplier.com"
            value={assignedEmail}
            onChange={(e) => setAssignedEmail(e.target.value)}
            helperText="Auto-assigned to primary security representative"
          />

          <Input
            label="SLA Due Date"
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={createMutation.isPending}
            leftIcon={<ShieldCheck className="h-4 w-4" />}
          >
            Launch Assessment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

