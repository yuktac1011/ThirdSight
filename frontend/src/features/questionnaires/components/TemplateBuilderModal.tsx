import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionnaireService } from '@/services/questionnaireService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SecurityDomainType, QuestionTypeValue } from '@/types';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface TemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DraftQuestion {
  text: string;
  domain: SecurityDomainType;
  question_type: QuestionTypeValue;
  guidance: string;
  weight: number;
  is_mandatory: boolean;
  requires_evidence: boolean;
}

const SECURITY_DOMAINS: SecurityDomainType[] = [
  'Access Control & Identity',
  'Data Protection & Cryptography',
  'Network Security & Architecture',
  'Incident Response & Resiliency',
  'Regulatory Compliance & Audit',
  'Vulnerability & Patch Management',
  'Third-Party & Supply Chain',
  'Physical & Environmental',
];

export const TemplateBuilderModal: React.FC<TemplateBuilderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frameworkTag, setFrameworkTag] = useState('Custom SecOps');
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    {
      text: 'Are administrative privileges restricted using role-based access control and least-privilege principles?',
      domain: 'Access Control & Identity',
      question_type: 'choice_partial',
      guidance: 'Provide RBAC documentation or user review schedule.',
      weight: 1.5,
      is_mandatory: true,
      requires_evidence: true,
    },
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: questionnaireService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire_templates'] });
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to create questionnaire template.');
    },
  });

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        domain: 'Access Control & Identity',
        question_type: 'choice_partial',
        guidance: '',
        weight: 1.0,
        is_mandatory: true,
        requires_evidence: false,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleUpdateQuestion = (index: number, field: keyof DraftQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Questionnaire title is required.');
      return;
    }

    if (questions.length === 0) {
      setFormError('At least one question is required.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim() || questions[i].text.trim().length < 5) {
        setFormError(`Question #${i + 1} text is too short (minimum 5 characters).`);
        return;
      }
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      framework_tag: frameworkTag.trim(),
      status: 'published',
      questions: questions.map((q, idx) => ({
        ...q,
        order_index: idx + 1,
      })),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Security Questionnaire Template"
      description="Design reusable framework assessments with categorized domains and evidence rules."
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 pr-2">
        {formError && (
          <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Template Title *"
            required
            placeholder="e.g. SOC 2 Type II Vendor Attestation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Framework / Compliance Tag"
            placeholder="e.g. ISO 27001 / NIST CSF / SIG Lite"
            value={frameworkTag}
            onChange={(e) => setFrameworkTag(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Questionnaire Scope & Instructions
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline expected response timelines and documentation requirements..."
            className="block w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900"
          />
        </div>

        {/* Dynamic Question Builder */}
        <div className="border-t border-slate-200 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Assessment Questions ({questions.length})
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Question
            </Button>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Question #{idx + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <textarea
                  rows={2}
                  required
                  placeholder="Enter security control inquiry or verification statement..."
                  value={q.text}
                  onChange={(e) => handleUpdateQuestion(idx, 'text', e.target.value)}
                  className="block w-full rounded border border-slate-300 bg-white p-2 text-xs"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-600 mb-0.5">
                      Security Domain
                    </label>
                    <select
                      value={q.domain}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, 'domain', e.target.value as SecurityDomainType)
                      }
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    >
                      {SECURITY_DOMAINS.map((dom) => (
                        <option key={dom} value={dom}>
                          {dom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-600 mb-0.5">
                      Response Type
                    </label>
                    <select
                      value={q.question_type}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, 'question_type', e.target.value as QuestionTypeValue)
                      }
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    >
                      <option value="choice_partial">Yes / Partial / No / N/A</option>
                      <option value="yes_no">Yes / No</option>
                      <option value="yes_no_na">Yes / No / N/A</option>
                      <option value="text">Free Text Input</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={q.is_mandatory}
                        onChange={(e) => handleUpdateQuestion(idx, 'is_mandatory', e.target.checked)}
                        className="rounded text-brand-600"
                      />
                      Mandatory
                    </label>

                    <label className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={q.requires_evidence}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, 'requires_evidence', e.target.checked)
                        }
                        className="rounded text-brand-600"
                      />
                      Requires Evidence / Artifact
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Weight:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="5.0"
                      value={q.weight}
                      onChange={(e) => handleUpdateQuestion(idx, 'weight', parseFloat(e.target.value) || 1.0)}
                      className="w-16 rounded border border-slate-300 p-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          >
            Publish Template
          </Button>
        </div>
      </form>
    </Modal>
  );
};

