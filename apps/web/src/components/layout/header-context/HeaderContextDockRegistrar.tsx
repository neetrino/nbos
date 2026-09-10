'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useRegisterMobileDockItems } from '@/components/layout/MobileModuleDockProvider';
import type { MobileDockItem } from '@/components/layout/mobile-module-dock-types';
import { useHeaderContextResolved } from './HeaderContextProvider';
import { isHeaderNavItemActive } from './header-context-nav-utils';

const EMPTY_DOCK_ITEMS: MobileDockItem[] = [];

/** Publishes header zone tabs into the mobile dock when they are not shown in the header. */
export function HeaderContextDockRegistrar() {
  const pathname = usePathname();
  const isMobileViewport = useIsMobileViewport();
  const content = useHeaderContextResolved();

  const items = useMemo<MobileDockItem[]>(() => {
    if (isMobileViewport || content?.kind !== 'nav') return EMPTY_DOCK_ITEMS;
    return content.items.map((item) => ({
      id: `header:${item.href}:${item.label}`,
      label: item.label,
      icon: item.icon,
      href: item.href,
      active: isHeaderNavItemActive(pathname, item),
    }));
  }, [content, isMobileViewport, pathname]);

  useRegisterMobileDockItems('header', items);
  return null;
}
