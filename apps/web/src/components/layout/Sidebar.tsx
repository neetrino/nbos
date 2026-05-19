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
import { SIDEBAR_NAV_LIST_CLASS } from './sidebar-layout-constants';

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

  return (
    <aside
      className={cn(
        'border-sidebar-border bg-sidebar fixed top-0 left-0 z-40 flex h-screen flex-col border-r transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[260px]',
      )}
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

      <div className="border-sidebar-border border-t p-2">
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
        'border-sidebar-border flex h-14 shrink-0 items-center border-b px-3',
        collapsed ? 'justify-center' : 'gap-2',
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
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center">
          <img
            src="/logo/logo.svg"
            alt="NBOS"
            width={144}
            height={24}
            fetchPriority="high"
            className="h-6 w-auto max-w-full"
          />
        </Link>
      )}
    </div>
  );
}
