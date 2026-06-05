'use client';

import { Suspense, useState } from 'react';
import { cn } from '@/lib/utils';
import { MyAccountSheetProvider } from '@/features/account/components/my-account-sheet-provider';
import { MyWalletSheetProvider } from '@/features/account/components/my-wallet-sheet-provider';
import { HeaderContextProvider } from './header-context';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { APP_MAIN_CONTENT_INSET } from './app-layout-constants';
import { SIDEBAR_WIDTH_COLLAPSED_PX, SIDEBAR_WIDTH_EXPANDED_PX } from './sidebar-layout-constants';
import { AppEntityRelationProvider } from '@/components/shared/relation-picker/AppEntityRelationProvider';
import { EmployeeDirectoryWarmup } from '@/lib/employees';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainOffsetPx = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED_PX : SIDEBAR_WIDTH_EXPANDED_PX;

  return (
    <HeaderContextProvider>
      <Suspense fallback={null}>
        <MyAccountSheetProvider>
          <MyWalletSheetProvider>
            <EmployeeDirectoryWarmup />
            <div
              className="bg-background grid h-screen overflow-hidden transition-[grid-template-columns] duration-300 ease-in-out"
              style={{ gridTemplateColumns: `${mainOffsetPx}px minmax(0, 1fr)` }}
            >
              <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
              <div className="flex min-w-0 flex-col overflow-hidden">
                <Topbar />
                <main
                  className={cn(
                    'bg-background flex-1 overflow-y-auto overscroll-contain',
                    APP_MAIN_CONTENT_INSET,
                  )}
                >
                  <AppEntityRelationProvider>{children}</AppEntityRelationProvider>
                </main>
              </div>
            </div>
          </MyWalletSheetProvider>
        </MyAccountSheetProvider>
      </Suspense>
    </HeaderContextProvider>
  );
}
