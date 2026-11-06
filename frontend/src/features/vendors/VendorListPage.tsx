import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorService } from '@/services/vendorService';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/FeedbackStates';
import { VendorRegistrationModal } from './components/VendorRegistrationModal';
import {
  CriticalityBadge,
  VendorStatusBadge,
  DataClassificationBadge,
  AccessLevelBadge,
} from './components/VendorBadges';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
} from 'lucide-react';

export const VendorListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('vendor:write');

  const [searchTerm, setSearchTerm] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const {
    data: vendors,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vendors', searchTerm, criticalityFilter, statusFilter],
    queryFn: () =>
      vendorService.getVendors({
        search: searchTerm || undefined,
        criticality: criticalityFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Third-Party Vendor Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered suppliers, SaaS vendors, infrastructure providers, and ongoing risk tiering.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsRegisterModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Onboard Vendor
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search by vendor name, industry, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700"
            >
              <option value="">All Criticality Tiers</option>
              <option value="tier_1">Tier 1 (Mission Critical)</option>
              <option value="tier_2">Tier 2 (Significant)</option>
              <option value="tier_3">Tier 3 (Low)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700"
            >
              <option value="">All Lifecycle Statuses</option>
              <option value="active">Active</option>
              <option value="under_review">Under Review</option>
              <option value="monitored">Monitored</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Data Content */}
      {isLoading ? (
        <LoadingState message="Fetching tenant vendor repository..." />
      ) : error ? (
        <ErrorState message="Failed to load vendor directory." onRetry={() => refetch()} />
      ) : vendors && vendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          description={
            searchTerm || criticalityFilter || statusFilter
              ? "No vendors match the specified criteria. Try clearing search filters."
              : "No third-party vendors registered in your tenant organization yet."
          }
          actionLabel={canCreate ? "Onboard First Vendor" : undefined}
          onAction={() => setIsRegisterModalOpen(true)}
          icon={<Building2 className="h-8 w-8 text-slate-400" />}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Vendor Entity</TableHead>
                <TableHead>Industry / Category</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Data & Access</TableHead>
                <TableHead>Posture Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {vendors?.map((v) => {
                const scoreColor =
                  v.risk_score >= 80
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : v.risk_score >= 60
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200';

                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link
                        to={`/vendors/${v.id}`}
                        className="font-bold text-slate-900 hover:text-brand-600 transition-colors flex items-center gap-1 group"
                      >
                        {v.name}
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      {v.website && (
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {v.website.replace(/^https?:\/\//, '')}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-medium text-slate-800 block">
                        {v.industry}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {v.service_category}
                      </span>
                    </TableCell>

                    <TableCell>
                      <CriticalityBadge criticality={v.criticality} />
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <DataClassificationBadge classification={v.data_classification} />
                        <AccessLevelBadge access={v.access_level} />
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${scoreColor}`}
                      >
                        {v.risk_score} / 100
                      </span>
                    </TableCell>

                    <TableCell>
                      <VendorStatusBadge status={v.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <Link to={`/vendors/${v.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Registration Modal */}
      <VendorRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
