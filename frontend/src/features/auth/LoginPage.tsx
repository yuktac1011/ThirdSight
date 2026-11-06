import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string>('admin@cyberguard.internal');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login(email);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || 'Authentication failed. Please verify credentials or Keycloak identity.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (demoEmail: string) => {
    setEmail(demoEmail);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-900 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/20 mb-3">
          <Shield className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Third<span className="text-brand-400">Sight</span>
        </h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Third-Party Security Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-200">
          {isExpired && (
            <div className="mb-4 rounded-md bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              Your session has expired. Please authenticate again to resume.
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 rounded-md bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Enterprise Identity / Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-slate-900 hover:bg-slate-800"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In to Organization
            </Button>
          </form>

          {/* Quick Demo Personas */}
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Test Identity Personas:
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('admin@cyberguard.internal')}
                className="text-left p-2 rounded-md border border-slate-200 hover:bg-slate-50 text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800">Admin (Alex Vance)</span>
                  <div className="text-[11px] text-slate-500">admin@cyberguard.internal</div>
                </div>
                <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-1.5 py-0.5 rounded">All Permissions</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('analyst@cyberguard.internal')}
                className="text-left p-2 rounded-md border border-slate-200 hover:bg-slate-50 text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800">Analyst (Morgan Reed)</span>
                  <div className="text-[11px] text-slate-500">analyst@cyberguard.internal</div>
                </div>
                <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-1.5 py-0.5 rounded">Assessments & Vendors</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Federated with OpenID Connect (Keycloak) • Tenant-Isolated
        </p>
      </div>
    </div>
  );
};
