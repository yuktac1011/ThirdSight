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
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export const navigationItems: NavItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Assessments', href: '/assessments', icon: ClipboardCheck },
  { name: 'Questionnaires', href: '/questionnaires', icon: FileQuestion },
  { name: 'Evidence', href: '/evidence', icon: FileCheck },
  { name: 'Security Controls', href: '/security-controls', icon: Layers },
  { name: 'Risk Analysis', href: '/risk-analysis', icon: ShieldAlert },
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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:static lg:z-auto',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-brand-300 shadow-sm border border-brand-800">
              <Shield className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-slate-900 tracking-tight text-sm">
                  Third<span className="text-brand-600">Sight</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 truncate">
                  {user?.organization_name || 'SecOps Intelligence'}
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className={cn('px-2 mb-2', isCollapsed && 'sr-only')}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Platform Modules
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
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  )
                }
              >
                <Icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-105')} />
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* System status footer */}
        <div className="border-t border-slate-200/80 p-3 bg-slate-50/50">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Tenant Isolated
              </span>
              <span className="font-mono text-slate-600">{user?.organization_slug || 'v0.2.0'}</span>
            </div>
          ) : (
            <div className="flex justify-center" title="Platform Online">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

