'use client';

import { Suspense, startTransition, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { MyAccountSheetProvider } from '@/features/account/components/my-account-sheet-provider';
import { MyWalletSheetProvider } from '@/features/account/components/my-wallet-sheet-provider';
import { HeaderContextProvider } from './header-context';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import {
  APP_MAIN_CONTENT_DASHBOARD_MOBILE_INSET,
  APP_MAIN_CONTENT_INSET,
} from './app-layout-constants';
import { SIDEBAR_WIDTH_COLLAPSED_PX, SIDEBAR_WIDTH_EXPANDED_PX } from './sidebar-layout-constants';
import { AppEntityRelationProvider } from '@/components/shared/relation-picker/AppEntityRelationProvider';
import { UnsortedTaskCreateProvider } from '@/features/tasks/components/UnsortedTaskCreateProvider';
import { GlobalSearchProvider } from '@/features/global-search/GlobalSearchProvider';
import { IncomingCallProvider } from '@/features/crm/calls/IncomingCallProvider';
import { EmployeeDirectoryWarmup } from '@/lib/employees';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const isMobileViewport = useIsMobileViewport();
  const mainOffsetPx = isMobileViewport
    ? 0
    : sidebarCollapsed
      ? SIDEBAR_WIDTH_COLLAPSED_PX
      : SIDEBAR_WIDTH_EXPANDED_PX;

  /**
   * Auto-collapse the sidebar when entering /documents routes.
   * Once the user manually toggles, we stop overriding their preference for
   * the current Documents session. Leaving /documents resets the guard so the
   * next visit auto-collapses again.
   */
  const autoCollapsedRef = useRef(false);
  const isDocumentsRoute = pathname.startsWith('/documents');
  const isMessengerRoute = pathname.startsWith('/messenger');
  const isDashboardRoute = pathname === '/dashboard';

  useEffect(() => {
    if (isMobileViewport) return;
    if (isDocumentsRoute && !autoCollapsedRef.current) {
      autoCollapsedRef.current = true;
      startTransition(() => setSidebarCollapsed(true));
    } else if (!isDocumentsRoute) {
      autoCollapsedRef.current = false;
    }
  }, [isDocumentsRoute, isMobileViewport]);

  useEffect(() => {
    startTransition(() => setMobileNavOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!isMobileViewport) {
      startTransition(() => setMobileNavOpen(false));
    }
  }, [isMobileViewport]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-sidebar-width', `${mainOffsetPx}px`);
    return () => {
      document.documentElement.style.removeProperty('--app-sidebar-width');
    };
  }, [mainOffsetPx]);

  return (
    <HeaderContextProvider>
      <Suspense fallback={null}>
        <MyAccountSheetProvider>
          <MyWalletSheetProvider>
            <AppEntityRelationProvider>
              <GlobalSearchProvider>
                <UnsortedTaskCreateProvider>
                  <IncomingCallProvider>
                    <EmployeeDirectoryWarmup />
                    <div
                      className="bg-background grid h-screen overflow-hidden transition-[grid-template-columns] duration-300 ease-in-out"
                      style={{ gridTemplateColumns: `${mainOffsetPx}px minmax(0, 1fr)` }}
                    >
                      <Sidebar
                        collapsed={sidebarCollapsed}
                        onCollapsedChange={setSidebarCollapsed}
                        mobileOpen={isMobileViewport ? mobileNavOpen : undefined}
                        onMobileOpenChange={isMobileViewport ? setMobileNavOpen : undefined}
                      />
                      <div className="flex min-w-0 flex-col overflow-hidden">
                        <Topbar
                          showMobileMenuButton={isMobileViewport}
                          onMobileMenuClick={() => setMobileNavOpen(true)}
                        />
                        <main
                          className={cn(
                            'bg-background flex min-h-0 flex-1 flex-col overscroll-contain',
                            isMessengerRoute
                              ? 'overflow-hidden'
                              : 'overflow-y-auto [scrollbar-gutter:stable]',
                            APP_MAIN_CONTENT_INSET,
                            isDashboardRoute && APP_MAIN_CONTENT_DASHBOARD_MOBILE_INSET,
                            isDashboardRoute && 'max-md:[scrollbar-gutter:auto]',
                          )}
                        >
                          {children}
                        </main>
                      </div>
                    </div>
                  </IncomingCallProvider>
                </UnsortedTaskCreateProvider>
              </GlobalSearchProvider>
            </AppEntityRelationProvider>
          </MyWalletSheetProvider>
        </MyAccountSheetProvider>
      </Suspense>
    </HeaderContextProvider>
  );
}
