import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/authAndOrg';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import { UserPlus, Mail, Shield, Trash2, CheckCircle2 } from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canInvite = hasPermission('user:invite');
  const canDelete = hasPermission('user:delete');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('analyst');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const {
    data: members,
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ['organization_users'],
    queryFn: userService.getMembers,
  });

  const inviteMutation = useMutation({
    mutationFn: userService.inviteMember,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization_invitations'] });
      setInviteSuccess(`Invitation link created for ${data.email}`);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(null), 4000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_users'] });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    inviteMutation.mutate({ email: inviteEmail, role_name: inviteRole });
  };

  const handleDeleteUser = (userId: string, email: string) => {
    if (confirm(`Revoke tenant access for ${email}?`)) {
      deleteMutation.mutate(userId);
    }
  };

  if (isMembersLoading) return <LoadingState message="Loading organization members..." />;
  if (membersError) return <ErrorState message="Failed to load member roster." />;

  return (
    <div className="space-y-6">
      {/* Invite Member Section */}
      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>
              Grant access to security analysts, internal auditors, or organization administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inviteSuccess && (
              <div className="mb-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {inviteSuccess}
              </div>
            )}
            <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <Input
                  label="Colleague Email Address"
                  type="email"
                  required
                  placeholder="name@enterprise.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                />
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="analyst">Security Analyst</option>
                  <option value="admin">Administrator</option>
                  <option value="auditor">Auditor (Read-Only)</option>
                  <option value="vendor_user">Vendor Contact</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={inviteMutation.isPending}
                leftIcon={<UserPlus className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Send Invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Member Roster Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Members ({members?.length || 0})</CardTitle>
          <CardDescription>
            Active accounts provisioned within current tenant boundary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>User / Identity</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added On</TableHead>
                {canDelete && <TableHead className="text-right">Actions</TableHead>}
              </tr>
            </TableHeader>
            <TableBody>
              {members?.map((m) => {
                const roleName = m.roles[0]?.name || 'analyst';
                const isSelf = m.id === currentUser?.id;

                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{m.full_name || 'Unnamed Member'}</div>
                      <div className="text-xs text-slate-500 font-mono">{m.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <Shield className="h-3 w-3 text-brand-600" />
                        {roleName.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {m.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {new Date(m.created_at).toLocaleDateString()}
                    </TableCell>
                    {canDelete && (
                      <TableCell className="text-right">
                        {!isSelf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            onClick={() => handleDeleteUser(m.id, m.email)}
                            title="Revoke access"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Current User</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
