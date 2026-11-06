import React from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  VendorCriticalityType,
  VendorStatusType,
  DataClassificationType,
  AccessLevelType,
} from '@/types';

export const CriticalityBadge: React.FC<{ criticality: VendorCriticalityType }> = ({ criticality }) => {
  switch (criticality) {
    case 'tier_1':
      return (
        <Badge variant="danger" size="sm">
          TIER 1 (CRITICAL)
        </Badge>
      );
    case 'tier_2':
      return (
        <Badge variant="warning" size="sm">
          TIER 2 (SIGNIFICANT)
        </Badge>
      );
    case 'tier_3':
      return (
        <Badge variant="info" size="sm">
          TIER 3 (LOW EXPOSURE)
        </Badge>
      );
    default:
      return <Badge variant="neutral" size="sm">{criticality}</Badge>;
  }
};

export const VendorStatusBadge: React.FC<{ status: VendorStatusType }> = ({ status }) => {
  switch (status) {
    case 'active':
      return (
        <Badge variant="success" size="sm">
          Active
        </Badge>
      );
    case 'under_review':
      return (
        <Badge variant="warning" size="sm">
          Under Review
        </Badge>
      );
    case 'monitored':
      return (
        <Badge variant="info" size="sm">
          Monitored
        </Badge>
      );
    case 'decommissioned':
      return (
        <Badge variant="neutral" size="sm">
          Decommissioned
        </Badge>
      );
    default:
      return <Badge variant="default" size="sm">{status}</Badge>;
  }
};

export const DataClassificationBadge: React.FC<{ classification: DataClassificationType }> = ({
  classification,
}) => {
  switch (classification) {
    case 'restricted':
      return <Badge variant="danger" size="sm">Restricted Data</Badge>;
    case 'confidential':
      return <Badge variant="warning" size="sm">Confidential</Badge>;
    case 'internal':
      return <Badge variant="info" size="sm">Internal Only</Badge>;
    case 'public':
      return <Badge variant="neutral" size="sm">Public Data</Badge>;
  }
};

export const AccessLevelBadge: React.FC<{ access: AccessLevelType }> = ({ access }) => {
  return (
    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700 capitalize">
      {access} Access
    </span>
  );
};

