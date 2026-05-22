'use client';

import { useState } from 'react';
import { HeaderContextProvider } from './header-context';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SIDEBAR_WIDTH_COLLAPSED_PX, SIDEBAR_WIDTH_EXPANDED_PX } from './sidebar-layout-constants';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainOffsetPx = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED_PX : SIDEBAR_WIDTH_EXPANDED_PX;

  return (
    <HeaderContextProvider>
      <div
        className="bg-background grid h-screen overflow-hidden transition-[grid-template-columns] duration-300 ease-in-out"
        style={{ gridTemplateColumns: `${mainOffsetPx}px minmax(0, 1fr)` }}
      >
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        <div className="flex min-w-0 flex-col overflow-hidden">
          <Topbar />
          <main className="bg-background flex-1 overflow-y-auto overscroll-contain p-6">
            {children}
          </main>
        </div>
      </div>
    </HeaderContextProvider>
  );
}
