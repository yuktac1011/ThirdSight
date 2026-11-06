import React from 'react';
import { Menu, Bell, Search, LogOut } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SO';

  const userRole = user?.roles[0]?.name ? user.roles[0].name.toUpperCase() : 'ANALYST';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Left side: mobile toggle + breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side: Quick Search, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search placeholder */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search vendors, controls, findings..."
            className="h-9 w-64 rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
            disabled
            title="Search will be functional in future increments"
          />
        </div>

        {/* Intelligence feed / notifications placeholder */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title="Security Notifications"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
          </span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User profile with tenant and logout */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-sm ring-1 ring-slate-200">
            {userInitials}
          </div>
          <div className="hidden text-left lg:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.full_name || user?.email || 'SecOps User'}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight flex items-center gap-1">
              <span>{user?.organization_name || 'Organization'}</span>
              <span>•</span>
              <span className="font-semibold text-brand-600">{userRole}</span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out of ThirdSight"
            aria-label="Sign out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

