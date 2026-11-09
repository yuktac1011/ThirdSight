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
  <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
    <div className="relative flex items-center justify-center mb-4">
      <div className="absolute h-10 w-10 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
    <p className="text-sm font-semibold text-slate-300">{message}</p>
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
  <div className={cn('flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/50 backdrop-blur-md', className)}>
    <div className="rounded-2xl bg-slate-800/80 p-3.5 text-slate-400 mb-3 border border-slate-700/80 shadow-subtle">
      {icon || <Inbox className="h-6 w-6" />}
    </div>
    <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
    <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  retry,
  onRetry,
  className,
}) => {
  const handleRetry = retry || onRetry;
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center border border-rose-500/30 rounded-2xl bg-rose-950/20 backdrop-blur-md', className)}>
      <div className="rounded-2xl bg-rose-950/50 border border-rose-500/40 p-3 text-rose-400 mb-3 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-rose-200 mb-1">{title}</h3>
      <p className="text-xs text-rose-300/80 max-w-sm mb-4">{message}</p>
      {handleRetry && (
        <Button variant="danger" size="sm" onClick={handleRetry}>
          Retry Action
        </Button>
      )}
    </div>
  );
};
