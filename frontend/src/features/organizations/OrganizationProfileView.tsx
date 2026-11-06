import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/authAndOrg';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import { Building2, Check } from 'lucide-react';

export const OrganizationProfileView: React.FC = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasPermission('org:update');

  const { data: org, isLoading, error } = useQuery({
    queryKey: ['current_organization'],
    queryFn: organizationService.getCurrentOrganization,
  });

  const [orgName, setOrgName] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  React.useEffect(() => {
    if (org) {
      setOrgName(org.name);
    }
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: (newName: string) => organizationService.updateCurrentOrganization({ name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current_organization'] });
      queryClient.invalidateQueries({ queryKey: ['auth_user'] });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    },
  });

  if (isLoading) return <LoadingState message="Loading organization configuration..." />;
  if (error || !org) return <ErrorState message="Could not load organization details." />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;
    updateMutation.mutate(orgName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{org.name}</CardTitle>
                <CardDescription>Primary Tenant Domain & Boundary Isolation</CardDescription>
              </div>
            </div>
            <Badge variant="success" size="md">
              Tenant Status: {org.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            {successMsg && (
              <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                Organization configuration updated successfully.
              </div>
            )}

            <div>
              <Input
                label="Organization Display Name"
                value={orgName}
                disabled={!canUpdate || updateMutation.isPending}
                onChange={(e) => setOrgName(e.target.value)}
                helperText={!canUpdate ? 'Requires org:update permission to change.' : undefined}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Tenant Slug (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={org.slug}
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 px-3 text-sm text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Tenant UUID
                </label>
                <input
                  type="text"
                  disabled
                  value={org.id}
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 px-3 text-sm text-slate-500 font-mono truncate"
                />
              </div>
            </div>

            {canUpdate && (
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={updateMutation.isPending}
              >
                Save Organization Changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
