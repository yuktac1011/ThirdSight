import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorService } from '@/services/vendorService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  VendorCriticalityType,
  VendorStatusType,
  DataClassificationType,
  AccessLevelType,
} from '@/types';
import { Building2, Globe, Shield, User, AlertCircle } from 'lucide-react';

interface VendorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VendorRegistrationModal: React.FC<VendorRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [serviceCategory, setServiceCategory] = useState('Software / SaaS');
  const [serviceDescription, setServiceDescription] = useState('');
  const [criticality, setCriticality] = useState<VendorCriticalityType>('tier_2');
  const [status, setStatus] = useState<VendorStatusType>('under_review');
  const [dataClassification, setDataClassification] = useState<DataClassificationType>('confidential');
  const [accessLevel, setAccessLevel] = useState<AccessLevelType>('application');

  // Primary Contact
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: vendorService.createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      resetForm();
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to register vendor.');
    },
  });

  const resetForm = () => {
    setName('');
    setWebsite('');
    setIndustry('Technology');
    setServiceCategory('Software / SaaS');
    setServiceDescription('');
    setCriticality('tier_2');
    setStatus('under_review');
    setDataClassification('confidential');
    setAccessLevel('application');
    setContactName('');
    setContactEmail('');
    setContactTitle('');
    setContactPhone('');
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Vendor name is required.');
      return;
    }

    const contacts = contactEmail.trim()
      ? [
          {
            name: contactName.trim() || 'Primary Contact',
            email: contactEmail.trim(),
            title: contactTitle.trim() || undefined,
            phone: contactPhone.trim() || undefined,
            is_primary: true,
          },
        ]
      : [];

    createMutation.mutate({
      name: name.trim(),
      website: website.trim() || undefined,
      industry,
      service_category: serviceCategory,
      service_description: serviceDescription.trim() || undefined,
      criticality,
      status,
      data_classification: dataClassification,
      access_level: accessLevel,
      contacts,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard New Third-Party Vendor"
      description="Register supplier profile, classify risk criticality, and assign security contacts."
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 pr-2">
        {formError && (
          <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            {formError}
          </div>
        )}

        {/* Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Vendor Entity Name *"
            required
            placeholder="e.g. Acme Cloud Services"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<Building2 className="h-4 w-4" />}
          />
          <Input
            label="Domain / Website URL"
            type="url"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            leftIcon={<Globe className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Industry Sector
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="Technology">Technology</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
              <option value="Telecommunications">Telecommunications</option>
              <option value="Retail & E-commerce">Retail & E-commerce</option>
              <option value="Professional Services">Professional Services</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Service Category
            </label>
            <select
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="Software / SaaS">Software / SaaS</option>
              <option value="IaaS / Hosting / Cloud">IaaS / Hosting / Cloud</option>
              <option value="Payment Processing">Payment Processing</option>
              <option value="Data Analytics & AI">Data Analytics & AI</option>
              <option value="IT Managed Services">IT Managed Services</option>
              <option value="Security Services">Security Services</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Service Description & Scope
          </label>
          <textarea
            rows={2}
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            placeholder="Describe the nature of third-party integration, data shared, and architectural boundaries..."
            className="block w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Security & Risk Classification Matrix */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-800">
            <Shield className="h-4 w-4 text-brand-600" />
            Security & Tiering Classification
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Criticality Tier
              </label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as VendorCriticalityType)}
                className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-900"
              >
                <option value="tier_1">Tier 1 — Mission Critical</option>
                <option value="tier_2">Tier 2 — Significant Impact</option>
                <option value="tier_3">Tier 3 — Low Exposure</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Initial Onboarding Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatusType)}
                className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-900"
              >
                <option value="under_review">Under Review</option>
                <option value="active">Active</option>
                <option value="monitored">Monitored</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Data Classification
              </label>
              <select
                value={dataClassification}
                onChange={(e) => setDataClassification(e.target.value as DataClassificationType)}
                className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-900"
              >
                <option value="restricted">Restricted / PII / Financial</option>
                <option value="confidential">Confidential</option>
                <option value="internal">Internal Only</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                System Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as AccessLevelType)}
                className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-900"
              >
                <option value="none">None (No direct network access)</option>
                <option value="network">Network Layer (VPN / Peering)</option>
                <option value="application">Application API / OAuth</option>
                <option value="database">Database Replication / Read</option>
                <option value="administrative">Administrative / Root Privileges</option>
              </select>
            </div>
          </div>
        </div>

        {/* Primary Contact Person */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-800">
            <User className="h-4 w-4 text-brand-600" />
            Vendor Security Representative (Optional)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Full Name"
              placeholder="e.g. Jane Foster"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              label="Contact Work Email"
              type="email"
              placeholder="security@supplier.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Input
              label="Job Title"
              placeholder="e.g. CISO / Risk Officer"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+1-555-010-002"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={createMutation.isPending}
          >
            Complete Onboarding
          </Button>
        </div>
      </form>
    </Modal>
  );
};

