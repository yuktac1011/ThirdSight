import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { AssessmentStatus } from '@/types';

export const AssessmentStatusBadge: React.FC<{ status: AssessmentStatus }> = ({ status }) => {
  switch (status) {
    case 'approved':
      return <Badge variant="success" size="sm">Approved</Badge>;
    case 'submitted':
    case 'under_review':
      return <Badge variant="info" size="sm">Under Review</Badge>;
    case 'in_progress':
      return <Badge variant="warning" size="sm">In Progress</Badge>;
    case 'assigned':
      return <Badge variant="default" size="sm">Assigned</Badge>;
    case 'initiated':
      return <Badge variant="neutral" size="sm">Initiated</Badge>;
    case 'reopened':
      return <Badge variant="warning" size="sm">Reopened</Badge>;
    case 'rejected':
      return <Badge variant="danger" size="sm">Rejected</Badge>;
    default:
      return <Badge variant="neutral" size="sm">{status}</Badge>;
  }
};

