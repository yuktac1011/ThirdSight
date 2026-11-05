import React from 'react';
import { cn } from '@/lib/utils';
import { SeverityLevel } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  severity?: SeverityLevel;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  severity,
  size = 'md',
  children,
  ...props
}) => {
  // If severity is provided, map to standard alert styling
  let resolvedVariant = variant;
  if (severity) {
    if (severity === 'critical' || severity === 'high') resolvedVariant = 'danger';
    else if (severity === 'medium') resolvedVariant = 'warning';
    else if (severity === 'low') resolvedVariant = 'success';
    else resolvedVariant = 'info';
  }

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium',
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

