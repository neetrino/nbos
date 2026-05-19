'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/permissions';
import { NAV_MODULE_DEFINITIONS } from '@/lib/navigation/nav-config';
import { applySidebarPreferences } from '@/lib/navigation/apply-sidebar-preferences';
import { getVisibleNavModules } from '@/lib/navigation/nav-visibility';
import { useSidebarNavigation } from '@/lib/navigation/use-sidebar-navigation';
import { SidebarNavList } from './SidebarNavList';
import { SidebarNavigationCustomizeSheet } from './SidebarNavigationCustomizeSheet';

type SidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const { can, isLoading: permsLoading } = usePermission();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const navigation = useSidebarNavigation();

  const visibleModules = useMemo(
    () => getVisibleNavModules(can, permsLoading, NAV_MODULE_DEFINITIONS),
    [can, permsLoading],
  );

  const layout = useMemo(
    () =>
      applySidebarPreferences(
        visibleModules,
        navigation.sidebarModuleOrder,
        navigation.hiddenSidebarModules,
      ),
    [visibleModules, navigation.sidebarModuleOrder, navigation.hiddenSidebarModules],
  );

  const visibleKeys = useMemo(
    () => [...layout.primary, ...layout.hidden].map((item) => item.key),
    [layout.primary, layout.hidden],
  );

  const handleMove = (key: SidebarModuleKey, direction: 'up' | 'down') => {
    navigation.moveModule(visibleKeys, key, direction);
  };

  return (
    <aside
      className={cn(
        'border-sidebar-border bg-sidebar fixed top-0 left-0 z-40 flex h-screen flex-col border-r transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[260px]',
      )}
    >
      <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center">
            <img
              src="/logo/logo.svg"
              alt="NBOS"
              width={144}
              height={24}
              fetchPriority="high"
              className="h-6 w-auto"
            />
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center">
            <Image src="/logo/icon.png" alt="NBOS" width={32} height={32} className="h-8 w-8" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <SidebarNavList
          collapsed={collapsed}
          primaryItems={layout.primary}
          hiddenItems={layout.hidden}
          personalLinks={navigation.sidebarLinks}
          moreExpanded={moreExpanded}
          onToggleMore={() => setMoreExpanded((value) => !value)}
        />
      </nav>

      <div className="border-sidebar-border space-y-1 border-t p-3">
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <SlidersHorizontal size={18} />
            <span>Customize menu</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors"
        >
          <ChevronLeft
            size={18}
            className={cn('transition-transform', collapsed && 'rotate-180')}
          />
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>

      <SidebarNavigationCustomizeSheet
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        primaryItems={layout.primary}
        hiddenItems={layout.hidden}
        personalLinks={navigation.sidebarLinks}
        isSaving={navigation.isSaving}
        onMove={handleMove}
        onHide={navigation.hideModule}
        onRestore={navigation.restoreModule}
        onCreateLink={navigation.createPersonalLink}
        onDeleteLink={navigation.deletePersonalLink}
      />
    </aside>
  );
}
