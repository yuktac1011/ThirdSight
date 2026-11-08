import React from 'react';
import { cn } from '@/lib/utils';
import { SeverityLevel } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan';
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
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-500/30 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-500/30 font-semibold shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    info: 'bg-blue-950/60 text-blue-300 border-blue-500/30 font-semibold shadow-[0_0_12px_rgba(59,130,246,0.15)]',
    purple: 'bg-purple-950/60 text-purple-300 border-purple-500/30 font-semibold shadow-[0_0_12px_rgba(168,85,247,0.15)]',
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]',
  };

  const dotStyles = {
    default: 'bg-slate-400',
    neutral: 'bg-slate-500',
    success: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    warning: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    danger: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
    info: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
    purple: 'bg-purple-400 shadow-[0_0_8px_#c084fc]',
    cyan: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border font-medium tracking-tight backdrop-blur-md transition-all duration-150',
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
