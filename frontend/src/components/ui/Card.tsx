import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: 'brand' | 'cyan' | 'purple' | 'none';
}

export const Card: React.FC<CardProps> = ({ className, hover = false, glow = 'none', children, ...props }) => {
  const glowClasses = {
    brand: 'border-brand-500/30 shadow-[0_0_25px_-5px_rgba(59,130,246,0.15)]',
    cyan: 'border-cyan-500/30 shadow-[0_0_25px_-5px_rgba(6,182,212,0.15)]',
    purple: 'border-purple-500/30 shadow-[0_0_25px_-5px_rgba(168,85,247,0.15)]',
    none: 'border-slate-800/80',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-slate-900/80 backdrop-blur-xl p-5 shadow-glass transition-all duration-300',
        glowClasses[glow],
        hover && 'hover:border-slate-700 hover:bg-slate-800/80 hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {/* Subtle top edge glow highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4 border-b border-slate-800/70', className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('text-base font-bold leading-none tracking-tight text-white flex items-center gap-2', className)} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-xs text-slate-400 mt-1 leading-relaxed', className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('pt-4', className)} {...props} />
);
