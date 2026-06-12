'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/permissions';
import { NAV_MODULE_DEFINITIONS } from '@/lib/navigation/nav-config';
import { applySidebarPreferences } from '@/lib/navigation/apply-sidebar-preferences';
import { getVisibleNavModules } from '@/lib/navigation/nav-visibility';
import { useSidebarNavigation } from '@/lib/navigation/use-sidebar-navigation';
import { SidebarNavList } from './SidebarNavList';
import { SidebarNavigationCustomizeSheet } from './SidebarNavigationCustomizeSheet';
import { SidebarSettingsMenu } from './SidebarSettingsMenu';
import {
  SIDEBAR_HEADER_CLASS,
  SIDEBAR_HEADER_HEIGHT_CLASS,
  SIDEBAR_LOGO_MAX_WIDTH_CLASS,
  SIDEBAR_NAV_LIST_CLASS,
  SIDEBAR_WIDTH_COLLAPSED_PX,
  SIDEBAR_WIDTH_EXPANDED_PX,
} from './sidebar-layout-constants';

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

  const handleReorder = (primaryKeys: SidebarModuleKey[]) => {
    navigation.reorderPrimaryModules(visibleKeys, primaryKeys);
  };

  const sidebarWidthPx = collapsed ? SIDEBAR_WIDTH_COLLAPSED_PX : SIDEBAR_WIDTH_EXPANDED_PX;

  return (
    <aside
      className="border-sidebar-border bg-sidebar z-40 flex h-screen min-w-0 shrink-0 flex-col overflow-x-hidden border-r"
      style={{ width: sidebarWidthPx }}
    >
      <SidebarHeader collapsed={collapsed} onCollapsedChange={onCollapsedChange} />

      <nav className={cn('flex-1 overflow-y-auto', SIDEBAR_NAV_LIST_CLASS)}>
        <SidebarNavList
          collapsed={collapsed}
          primaryItems={layout.primary}
          hiddenItems={layout.hidden}
          personalLinks={navigation.sidebarLinks}
          moreExpanded={moreExpanded}
          onToggleMore={() => setMoreExpanded((value) => !value)}
        />
      </nav>

      <div className="border-sidebar-border border-t p-1.5">
        <SidebarSettingsMenu collapsed={collapsed} onCustomizeMenu={() => setCustomizeOpen(true)} />
      </div>

      <SidebarNavigationCustomizeSheet
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        primaryItems={layout.primary}
        hiddenItems={layout.hidden}
        personalLinks={navigation.sidebarLinks}
        isSaving={navigation.isSaving}
        onReorder={handleReorder}
        onHide={navigation.hideModule}
        onRestore={navigation.restoreModule}
        onCreateLink={navigation.createPersonalLink}
        onDeleteLink={navigation.deletePersonalLink}
      />
    </aside>
  );
}

function SidebarHeader({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  return (
    <div
      className={cn(
        SIDEBAR_HEADER_CLASS,
        SIDEBAR_HEADER_HEIGHT_CLASS,
        collapsed && 'justify-center',
      )}
    >
      <button
        type="button"
        onClick={() => onCollapsedChange(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
      >
        <Menu size={20} />
      </button>
      {!collapsed && (
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- sidebar logo SVG; fixed dimensions, no next/image benefit */}
          <img
            src="/logo/logo.svg"
            alt="NBOS"
            width={120}
            height={20}
            className={cn('h-5 w-auto', SIDEBAR_LOGO_MAX_WIDTH_CLASS)}
          />
        </Link>
      )}
    </div>
  );
}
