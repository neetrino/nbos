'use client';

import { useState } from 'react';
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
    <div className="bg-background flex h-screen overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: mainOffsetPx }}
      >
        <Topbar />
        <main className="bg-background flex-1 overflow-y-auto overscroll-contain p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
