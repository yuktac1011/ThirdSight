import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vendorService } from '@/services/vendorService';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import {
  CriticalityBadge,
  VendorStatusBadge,
  DataClassificationBadge,
  AccessLevelBadge,
} from './components/VendorBadges';
import {
  Globe,
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Trash2,
  Edit,
  Save,
  Plus,
  ClipboardList,
} from 'lucide-react';
import {
  VendorCriticalityType,
  VendorStatusType,
  DataClassificationType,
  AccessLevelType,
} from '@/types';

export const VendorDetailPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('vendor:write');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editServiceCategory, setEditServiceCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCriticality, setEditCriticality] = useState<VendorCriticalityType>('tier_2');
  const [editStatus, setEditStatus] = useState<VendorStatusType>('under_review');
  const [editDataClassification, setEditDataClassification] = useState<DataClassificationType>('confidential');
  const [editAccessLevel, setEditAccessLevel] = useState<AccessLevelType>('application');

  // New Contact Sub-form
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const {
    data: vendor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vendor_detail', vendorId],
    queryFn: () => vendorService.getVendorById(vendorId!),
    enabled: !!vendorId,
  });

  React.useEffect(() => {
    if (vendor) {
      setEditName(vendor.name);
      setEditWebsite(vendor.website || '');
      setEditIndustry(vendor.industry);
      setEditServiceCategory(vendor.service_category);
      setEditDescription(vendor.service_description || '');
      setEditCriticality(vendor.criticality);
      setEditStatus(vendor.status);
      setEditDataClassification(vendor.data_classification);
      setEditAccessLevel(vendor.access_level);
    }
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => vendorService.updateVendor(vendorId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor_detail', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => vendorService.deleteVendor(vendorId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      navigate('/vendors');
    },
  });

  const addContactMutation = useMutation({
    mutationFn: (contact: any) => vendorService.addContact(vendorId!, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor_detail', vendorId] });
      setIsAddingContact(false);
      setContactName('');
      setContactEmail('');
      setContactTitle('');
      setContactPhone('');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => vendorService.deleteContact(vendorId!, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor_detail', vendorId] });
    },
  });

  if (isLoading) return <LoadingState message="Loading vendor security dossier..." />;
  if (error || !vendor) return <ErrorState message="Could not locate vendor record within your tenant organization." />;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: editName,
      website: editWebsite || null,
      industry: editIndustry,
      service_category: editServiceCategory,
      service_description: editDescription || null,
      criticality: editCriticality,
      status: editStatus,
      data_classification: editDataClassification,
      access_level: editAccessLevel,
    });
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactName.trim()) return;
    addContactMutation.mutate({
      name: contactName.trim(),
      email: contactEmail.trim(),
      title: contactTitle.trim() || undefined,
      phone: contactPhone.trim() || undefined,
      is_primary: vendor.contacts.length === 0,
    });
  };

  const handleDeleteVendor = () => {
    if (confirm(`Are you sure you want to permanently delete '${vendor.name}' and all associated assessments?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/vendors')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Vendors
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {vendor.name}
              </h1>
              <VendorStatusBadge status={vendor.status} />
              <CriticalityBadge criticality={vendor.criticality} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ID: <span className="font-mono">{vendor.id}</span> • Registered on {new Date(vendor.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<Edit className="h-4 w-4" />}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={handleDeleteVendor}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Decommission
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Vendor Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vendor Profile / Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Architectural Profile</CardTitle>
              <CardDescription>
                Classification metrics governing risk score weighting and audit frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Industry Domain
                      </span>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{vendor.industry}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Service Category
                      </span>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{vendor.service_category}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Website / Host
                      </span>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">
                        {vendor.website ? (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            {vendor.website}
                          </a>
                        ) : (
                          <span className="text-slate-400">None specified</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Normalized Posture Score
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {vendor.risk_score} / 100
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Scope of Services & Engagement
                    </span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                      {vendor.service_description || 'No service description recorded.'}
                    </p>
                  </div>

                  {/* Tiering & Classification Tags */}
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                      Governance & Classification Tags
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <CriticalityBadge criticality={vendor.criticality} />
                      <DataClassificationBadge classification={vendor.data_classification} />
                      <AccessLevelBadge access={vendor.access_level} />
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Vendor Entity Name"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <Input
                      label="Website URL"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={editIndustry}
                        onChange={(e) => setEditIndustry(e.target.value)}
                        className="block w-full rounded-md border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                        Service Category
                      </label>
                      <input
                        type="text"
                        value={editServiceCategory}
                        onChange={(e) => setEditServiceCategory(e.target.value)}
                        className="block w-full rounded-md border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-600 mb-1">
                        Tier
                      </label>
                      <select
                        value={editCriticality}
                        onChange={(e) => setEditCriticality(e.target.value as VendorCriticalityType)}
                        className="w-full text-xs border rounded p-1.5"
                      >
                        <option value="tier_1">Tier 1</option>
                        <option value="tier_2">Tier 2</option>
                        <option value="tier_3">Tier 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-600 mb-1">
                        Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as VendorStatusType)}
                        className="w-full text-xs border rounded p-1.5"
                      >
                        <option value="under_review">Under Review</option>
                        <option value="active">Active</option>
                        <option value="monitored">Monitored</option>
                        <option value="decommissioned">Decommissioned</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-600 mb-1">
                        Data Class
                      </label>
                      <select
                        value={editDataClassification}
                        onChange={(e) => setEditDataClassification(e.target.value as DataClassificationType)}
                        className="w-full text-xs border rounded p-1.5"
                      >
                        <option value="restricted">Restricted</option>
                        <option value="confidential">Confidential</option>
                        <option value="internal">Internal</option>
                        <option value="public">Public</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-600 mb-1">
                        Access Level
                      </label>
                      <select
                        value={editAccessLevel}
                        onChange={(e) => setEditAccessLevel(e.target.value as AccessLevelType)}
                        className="w-full text-xs border rounded p-1.5"
                      >
                        <option value="none">None</option>
                        <option value="network">Network</option>
                        <option value="application">Application</option>
                        <option value="database">Database</option>
                        <option value="administrative">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Service Description
                    </label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="block w-full rounded-md border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={updateMutation.isPending}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Connected Risk & Assessment Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assessments & Audits</CardTitle>
                  <CardDescription>
                    Framework questionnaire evaluations dispatched to this vendor
                  </CardDescription>
                </div>
                <Link to="/assessments">
                  <Button variant="outline" size="sm" leftIcon={<ClipboardList className="h-3.5 w-3.5" />}>
                    Launch Assessment
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 text-center">
                <Shield className="h-7 w-7 text-brand-600 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-800">
                  Ready for Security Assessment
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                  Questionnaires (Increment 04) can be dispatched directly to this supplier's primary contact.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Contact Persons Roster */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vendor Contacts</CardTitle>
                  <CardDescription>Security & compliance representatives</CardDescription>
                </div>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingContact((prev) => !prev)}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isAddingContact && (
                <form
                  onSubmit={handleAddContactSubmit}
                  className="mb-4 rounded-lg border border-brand-200 bg-brand-50/30 p-3 space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-900">New Contact Representative</h4>
                  <Input
                    label="Full Name *"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                  <Input
                    label="Work Email *"
                    type="email"
                    required
                    placeholder="sjenkins@vendor.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                  <Input
                    label="Title / Department"
                    placeholder="e.g. Lead Information Security Officer"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                  />
                  <Input
                    label="Phone"
                    placeholder="+1-555-0199"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingContact(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={addContactMutation.isPending}
                    >
                      Save Contact
                    </Button>
                  </div>
                </form>
              )}

              {vendor.contacts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No contact persons on record.
                </p>
              ) : (
                <div className="space-y-3">
                  {vendor.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{contact.name}</span>
                            {contact.is_primary && (
                              <Badge variant="info" size="sm">Primary</Badge>
                            )}
                          </div>
                          {contact.title && (
                            <span className="text-[11px] text-slate-500 block">{contact.title}</span>
                          )}
                        </div>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => deleteContactMutation.mutate(contact.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove contact"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <a href={`mailto:${contact.email}`} className="hover:underline text-brand-600">
                            {contact.email}
                          </a>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 font-mono text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
