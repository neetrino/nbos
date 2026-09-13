'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { NavModuleDefinition } from '@/lib/navigation/nav-config';
import {
  SIDEBAR_FOOTER_CUSTOMIZE_BUTTON_CLASS,
  SIDEBAR_NAV_ITEM_CLASS,
} from './sidebar-layout-constants';
import { SidebarModuleIcon } from './SidebarModuleIcon';

const SIDEBAR_CUSTOMIZE_ICON_SIZE_PX = 16;

type SidebarFooterNavProps = {
  collapsed: boolean;
  settingsItem: NavModuleDefinition | null;
  onCustomizeMenu: () => void;
};

export function SidebarFooterNav({
  collapsed,
  settingsItem,
  onCustomizeMenu,
}: SidebarFooterNavProps) {
  const t = useTranslations('navigation');

  return (
    <div
      className={cn(
        'border-sidebar-border flex border-t p-1.5',
        collapsed ? 'flex-col items-center gap-0.5' : 'items-center gap-0.5',
      )}
    >
      {settingsItem ? (
        <SidebarFooterSettingsLink collapsed={collapsed} settingsItem={settingsItem} />
      ) : null}
      <button
        type="button"
        onClick={onCustomizeMenu}
        aria-label={t('sidebar.customizeLeftMenu')}
        title={t('sidebar.customizeLeftMenu')}
        className={SIDEBAR_FOOTER_CUSTOMIZE_BUTTON_CLASS}
      >
        <PanelLeft size={SIDEBAR_CUSTOMIZE_ICON_SIZE_PX} aria-hidden />
      </button>
    </div>
  );
}

function SidebarFooterSettingsLink({
  collapsed,
  settingsItem,
}: {
  collapsed: boolean;
  settingsItem: NavModuleDefinition;
}) {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const settingsLabel = t('sidebar.settings');
  const settingsActive =
    pathname === settingsItem.href || pathname.startsWith(`${settingsItem.href}/`);

  return (
    <Link
      href={settingsItem.href}
      title={settingsLabel}
      data-sidebar-nav-active={settingsActive ? 'true' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-xl text-[13px] font-medium transition-colors duration-150',
        SIDEBAR_NAV_ITEM_CLASS,
        collapsed ? 'justify-center px-1.5 py-1' : 'min-w-0 flex-1',
        settingsActive
          ? 'bg-sidebar-accent text-sidebar-foreground'
          : 'text-sidebar-muted hover:bg-secondary/50 hover:text-sidebar-foreground',
      )}
    >
      <SidebarModuleIcon moduleKey={settingsItem.key} active={settingsActive} />
      {!collapsed && <span className="truncate">{settingsLabel}</span>}
    </Link>
  );
}
