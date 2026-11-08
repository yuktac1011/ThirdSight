import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  FileQuestion,
  FileCheck,
  ShieldAlert,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'brand' | 'cyan' | 'default';
}

export const navigationItems: NavItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Assessments', href: '/assessments', icon: ClipboardCheck },
  { name: 'Questionnaires', href: '/questionnaires', icon: FileQuestion },
  { name: 'Evidence Vault', href: '/evidence', icon: FileCheck },
  { name: 'Security Controls', href: '/security-controls', icon: Layers },
  { name: 'Risk & AI Engine', href: '/risk-analysis', icon: ShieldAlert, badge: 'AI', badgeVariant: 'brand' },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Monitoring', href: '/monitoring', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-xl transition-all duration-300 ease-in-out lg:static lg:z-auto shadow-2xl',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 text-white shadow-glow-brand ring-1 ring-white/20">
              <Shield className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white tracking-tight text-sm">
                    Third<span className="text-gradient-cyan">Sight</span>
                  </span>
                  <span className="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-400 border border-brand-500/30 tracking-wider">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                  {user?.organization_name || 'CyberGuard SecOps'}
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-white shadow-subtle transition-all"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className={cn('px-2.5 mb-2.5 flex items-center justify-between', isCollapsed && 'sr-only')}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              TPRM Intelligence
            </span>
          </div>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onCloseMobile}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 select-none',
                    isActive
                      ? 'bg-gradient-to-r from-brand-600/25 to-indigo-600/10 text-white border border-brand-500/40 shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)]'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-gradient-to-b from-cyan-400 to-brand-500 shadow-[0_0_8px_#38bdf8]" />
                    )}
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 tracking-tight">{item.name}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          'ml-auto rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wide flex items-center gap-1 shadow-sm',
                          item.badgeVariant === 'brand'
                            ? 'bg-gradient-to-r from-brand-600/40 to-purple-600/40 text-cyan-300 border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-800 text-slate-300'
                        )}
                      >
                        {item.badgeVariant === 'brand' && <Sparkles className="h-2.5 w-2.5 text-cyan-400" />}
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* System status footer */}
        <div className="border-t border-slate-800/80 p-3.5 bg-slate-900/50">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                </span>
                Isolated & Compliant
              </span>
              <span className="font-mono text-[10px] text-cyan-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700/80 shadow-subtle">
                {user?.organization_slug || 'prod-us1'}
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title="Platform Online & Isolated">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
