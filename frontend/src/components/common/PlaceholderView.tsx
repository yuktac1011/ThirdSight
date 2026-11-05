import React from 'react';
import { EmptyState } from '@/components/common/FeedbackStates';
import { Layers } from 'lucide-react';

interface PlaceholderViewProps {
  moduleName: string;
  description: string;
  icon?: React.ReactNode;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  moduleName,
  description,
  icon,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {moduleName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <EmptyState
        title={`${moduleName} Module Scaffolding`}
        description={`This module route has been wired into the ThirdSight application shell for Increment 01. Complete domain functionality and API integration will be introduced in subsequent increments.`}
        icon={icon || <Layers className="h-6 w-6 text-slate-400" />}
      />
    </div>
  );
};

