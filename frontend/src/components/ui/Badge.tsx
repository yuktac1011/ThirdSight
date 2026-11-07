import React from 'react';
import { cn } from '@/lib/utils';
import { SeverityLevel } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  severity?: SeverityLevel;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  severity,
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  let resolvedVariant = variant;
  if (severity) {
    if (severity === 'critical' || severity === 'high') resolvedVariant = 'danger';
    else if (severity === 'medium') resolvedVariant = 'warning';
    else if (severity === 'low') resolvedVariant = 'success';
    else resolvedVariant = 'info';
  }

  const variantStyles = {
    default: 'bg-slate-100/90 text-slate-700 border-slate-200/90',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/90 font-semibold',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/90 font-semibold',
    info: 'bg-sky-50 text-sky-800 border-sky-200/90 font-semibold',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/90 font-semibold',
  };

  const dotStyles = {
    default: 'bg-slate-400',
    neutral: 'bg-slate-400',
    success: 'bg-emerald-500 ring-2 ring-emerald-200',
    warning: 'bg-amber-500 ring-2 ring-amber-200',
    danger: 'bg-rose-500 ring-2 ring-rose-200',
    info: 'bg-sky-500 ring-2 ring-sky-200',
    purple: 'bg-purple-500 ring-2 ring-purple-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium tracking-tight shadow-subtle',
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotStyles[resolvedVariant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
