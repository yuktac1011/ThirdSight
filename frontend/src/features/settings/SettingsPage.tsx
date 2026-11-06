import React, { useState } from 'react';
import { OrganizationProfileView } from '@/features/organizations/OrganizationProfileView';
import { UserManagementView } from '@/features/users/UserManagementView';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Users, Shield, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'organization' | 'users' | 'roles'>('organization');
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Platform Settings & Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure tenant parameters, access control permissions, and user roster.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('organization')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'organization'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Organization Profile
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          Members & Invitations
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="h-4 w-4" />
          Roles & Permissions
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'organization' && <OrganizationProfileView />}
      {activeTab === 'users' && <UserManagementView />}
      {activeTab === 'roles' && (
        <Card>
          <CardHeader>
            <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
            <CardDescription>
              Your active authorization boundaries and permissions matrix.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Assigned Identity Roles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {user?.roles.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-brand-50 text-brand-800 border border-brand-200 text-xs font-semibold"
                    >
                      <Key className="h-3.5 w-3.5 text-brand-600" />
                      {r.name.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Effective Granted Permissions ({user?.permissions.length || 0})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {user?.permissions.map((p) => (
                    <div
                      key={p}
                      className="rounded bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-mono text-slate-700"
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

