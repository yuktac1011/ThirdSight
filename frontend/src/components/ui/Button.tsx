import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'cyber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none rounded-xl select-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 text-white shadow-glow-brand/50 hover:shadow-glow-brand hover:brightness-110 border border-brand-400/40',
      cyber: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan/50 hover:shadow-glow-cyan hover:brightness-110 border border-cyan-400/40',
      secondary: 'bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 active:bg-slate-800 border border-slate-700/80 shadow-subtle',
      outline: 'border border-slate-700/80 bg-slate-900/60 backdrop-blur-md text-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-600 shadow-subtle',
      ghost: 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
      danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-glow-danger/40 hover:shadow-glow-danger hover:brightness-110 border border-rose-500/40',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-10 px-5 text-sm font-semibold gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
