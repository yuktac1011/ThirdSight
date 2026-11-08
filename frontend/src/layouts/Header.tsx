import React from 'react';
import { Menu, Bell, Search, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
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

  const userRole = user?.roles[0]?.name ? user.roles[0].name.toUpperCase() : 'SECOPS ANALYST';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6 shadow-glass">
      {/* Left side: mobile toggle + breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden shadow-subtle transition-colors"
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
        {/* Search placeholder with keyboard pill */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search vendors, controls, findings..."
            className="h-9 w-72 rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-14 text-xs text-slate-200 placeholder:text-slate-500 focus:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all shadow-subtle"
            disabled
            title="Global search across entities"
          />
          <div className="absolute right-2.5 top-2 hidden sm:flex items-center gap-0.5 pointer-events-none">
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* AI Copilot Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-brand-600/20 via-purple-600/20 to-cyan-500/20 border border-brand-500/30 text-[11px] font-bold text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
          <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span>AI Assisted TPRM</span>
        </div>

        {/* Intelligence feed / notifications */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white shadow-subtle transition-all"
          title="Security Notifications & Reminders"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_6px_#38bdf8]"></span>
          </span>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* User profile with tenant and logout */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 via-indigo-600 to-cyan-500 text-xs font-extrabold text-white shadow-glow-brand/50 ring-1 ring-white/20">
            {userInitials}
          </div>
          <div className="hidden text-left lg:block">
            <div className="text-xs font-bold text-white leading-tight">
              {user?.full_name || user?.email || 'SecOps User'}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold mt-0.5">
              <ShieldCheck className="h-3 w-3" />
              <span>{userRole}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
            title="Sign out securely"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
