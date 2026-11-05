import React from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
    <Loader2 className="h-7 w-7 animate-spin text-brand-600 mb-3" />
    <p className="text-sm font-medium text-slate-500">{message}</p>
  </div>
);

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50/50', className)}>
    <div className="rounded-full bg-slate-100 p-3 text-slate-400 mb-3">
      {icon || <Inbox className="h-6 w-6" />}
    </div>
    <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>
    {actionLabel && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view.',
  onRetry,
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center p-8 text-center border border-rose-200 rounded-lg bg-rose-50/30', className)}>
    <div className="rounded-full bg-rose-100 p-3 text-rose-600 mb-3">
      <AlertCircle className="h-6 w-6" />
    </div>
    <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-xs text-slate-600 max-w-md mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

