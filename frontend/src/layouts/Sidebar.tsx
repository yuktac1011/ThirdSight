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
  badgeVariant?: 'brand' | 'default';
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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/90 bg-white backdrop-blur-md transition-all duration-300 ease-in-out lg:static lg:z-auto shadow-subtle',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80 bg-slate-50/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md ring-2 ring-brand-500/20">
              <Shield className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 tracking-tight text-sm">
                    Third<span className="text-brand-600 font-extrabold">Sight</span>
                  </span>
                  <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 border border-brand-200/70 tracking-wider">
                    ENTERPRISE
                  </span>
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 truncate">
                  {user?.organization_name || 'CyberGuard SecOps'}
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 shadow-subtle transition-all"
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
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 select-none',
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-subtle border border-brand-200/70'
                      : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-brand-600" />
                    )}
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110',
                        isActive ? 'text-brand-600' : 'text-slate-500 group-hover:text-slate-700'
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 tracking-tight">{item.name}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          'ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide flex items-center gap-0.5',
                          item.badgeVariant === 'brand'
                            ? 'bg-brand-100 text-brand-700 border border-brand-300/80 shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        {item.badgeVariant === 'brand' && <Sparkles className="h-2.5 w-2.5 text-brand-600" />}
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
        <div className="border-t border-slate-200/80 p-3 bg-slate-50/70">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 font-medium">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Isolated & Compliant
              </span>
              <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-subtle">
                {user?.organization_slug || 'prod-us1'}
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title="Platform Online & Isolated">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
