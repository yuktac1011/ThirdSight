import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4 ring-8 ring-rose-50">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Access Denied</h1>
      <p className="max-w-md text-sm text-slate-600 mb-6">
        Your current role does not possess the permissions required to view or modify this resource. If you believe this is an error, please contact your Organization Administrator.
      </p>
      <Button
        variant="outline"
        size="md"
        onClick={() => navigate('/')}
        leftIcon={<ArrowLeft className="h-4 w-4" />}
      >
        Return to Overview
      </Button>
    </div>
  );
};

