import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionnaireService } from '@/services/questionnaireService';
import { vendorService } from '@/services/vendorService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Send } from 'lucide-react';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTemplateId?: string;
  onSuccess?: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  preselectedTemplateId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [vendorId, setVendorId] = useState('');
  const [templateId, setTemplateId] = useState(preselectedTemplateId || '');
  const [assignedEmail, setAssignedEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedTemplateId) setTemplateId(preselectedTemplateId);
  }, [preselectedTemplateId]);

  const { data: vendors } = useQuery({
    queryKey: ['vendors_dropdown'],
    queryFn: () => vendorService.getVendors(),
    enabled: isOpen,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates_dropdown'],
    queryFn: () => questionnaireService.getTemplates(),
    enabled: isOpen,
  });

  // When vendor is selected, pre-fill primary contact email if available
  const handleVendorChange = (vId: string) => {
    setVendorId(vId);
    const selectedVendor = vendors?.find((v) => v.id === vId);
    if (selectedVendor && selectedVendor.contacts.length > 0) {
      setAssignedEmail(selectedVendor.contacts[0].email);
    } else {
      setAssignedEmail('');
    }
  };

  const assignMutation = useMutation({
    mutationFn: questionnaireService.createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire_assignments'] });
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to dispatch questionnaire.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vendorId) {
      setErrorMsg('Please select a target vendor entity.');
      return;
    }
    if (!templateId) {
      setErrorMsg('Please select a questionnaire template.');
      return;
    }

    assignMutation.mutate({
      vendor_id: vendorId,
      template_id: templateId,
      assigned_to_email: assignedEmail.trim() || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Questionnaire to Vendor"
      description="Assign a versioned security audit template to third-party vendor respondents."
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
            Target Third-Party Vendor *
          </label>
          <select
            required
            value={vendorId}
            onChange={(e) => handleVendorChange(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">-- Choose Vendor --</option>
            {vendors?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.criticality.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Questionnaire Template *
          </label>
          <select
            required
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">-- Select Template --</option>
            {templates?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} (v{t.version}) [{t.framework_tag}]
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Recipient Contact Email"
            type="email"
            placeholder="security@supplier.com"
            value={assignedEmail}
            onChange={(e) => setAssignedEmail(e.target.value)}
            helperText="Defaults to vendor primary security contact"
          />

          <Input
            label="Target SLA Completion Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Audit Scope & Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Provide context on why this questionnaire cycle is requested (e.g. Annual SOC 2 review)..."
            className="block w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900"
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
            isLoading={assignMutation.isPending}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Dispatch Questionnaire
          </Button>
        </div>
      </form>
    </Modal>
  );
};

