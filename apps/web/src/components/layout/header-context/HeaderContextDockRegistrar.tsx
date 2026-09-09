'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useRegisterMobileDockItems } from '@/components/layout/MobileModuleDockProvider';
import type { MobileDockItem } from '@/components/layout/mobile-module-dock-types';
import { useHeaderContextResolved } from './HeaderContextProvider';
import { isHeaderNavItemActive } from './header-context-nav-utils';

/** Publishes header zone tabs into the mobile module dock. Renders nothing. */
export function HeaderContextDockRegistrar() {
  const pathname = usePathname();
  const content = useHeaderContextResolved();

  const items = useMemo<MobileDockItem[]>(() => {
    if (content?.kind !== 'nav') return [];
    return content.items.map((item) => ({
      id: `header:${item.href}:${item.label}`,
      label: item.label,
      icon: item.icon,
      href: item.href,
      active: isHeaderNavItemActive(pathname, item),
    }));
  }, [content, pathname]);

  useRegisterMobileDockItems('header', items);
  return null;
}
