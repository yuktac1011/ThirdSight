import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/layouts/Sidebar';
import { Header } from '@/layouts/Header';

export const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Cyber Mesh Lighting Effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-left Indigo glow */}
        <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
        {/* Top-right Purple glow */}
        <div className="absolute -top-[15%] right-[10%] h-[550px] w-[550px] rounded-full bg-purple-600/10 blur-[140px]" />
        {/* Center-bottom Cyan glow */}
        <div className="absolute bottom-[5%] left-[30%] h-[450px] w-[450px] rounded-full bg-cyan-500/5 blur-[120px]" />
        {/* Subtle grid pattern texture */}
        <div className="absolute inset-0 bg-grid-pattern [background-size:24px_24px] opacity-40" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main View Area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onOpenMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
