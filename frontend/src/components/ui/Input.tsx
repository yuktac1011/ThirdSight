import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={generatedId} className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-subtle">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            id={generatedId}
            ref={ref}
            className={cn(
              'block w-full rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md py-2 text-sm text-white placeholder:text-slate-500 transition-all',
              'focus:border-brand-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
              'disabled:cursor-not-allowed disabled:bg-slate-950 disabled:text-slate-600',
              leftIcon ? 'pl-10 pr-3.5' : 'px-3.5',
              error && 'border-rose-500/60 text-rose-300 focus:border-rose-500 focus:ring-rose-500/30',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
