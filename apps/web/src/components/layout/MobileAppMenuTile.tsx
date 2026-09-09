'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavModuleDefinition } from '@/lib/navigation/nav-config';
import { useModuleEntryHref } from '@/lib/navigation/hooks/use-module-entry-href';
import { SIDEBAR_MODULE_VISUALS } from './sidebar-module-visual';
import {
  MOBILE_APP_MENU_TILE_ACTIVE_CLASS,
  MOBILE_APP_MENU_TILE_CLASS,
  isMobileAppMenuItemActive,
} from './mobile-app-menu-constants';

const MOBILE_APP_MENU_ICON_SIZE_PX = 22;

interface MobileAppMenuTileProps {
  item: NavModuleDefinition;
  onNavigate: () => void;
}

export function MobileAppMenuTile({ item, onNavigate }: MobileAppMenuTileProps) {
  const pathname = usePathname();
  const href = useModuleEntryHref(item.key, item.href, pathname);
  const active = isMobileAppMenuItemActive(pathname, item.href, href);
  const { Icon, iconClass } = SIDEBAR_MODULE_VISUALS[item.key];

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(MOBILE_APP_MENU_TILE_CLASS, active && MOBILE_APP_MENU_TILE_ACTIVE_CLASS)}
    >
      <Icon className={iconClass} size={MOBILE_APP_MENU_ICON_SIZE_PX} strokeWidth={2} aria-hidden />
      <span className="text-sm leading-tight font-semibold tracking-tight">{item.label}</span>
    </Link>
  );
}
