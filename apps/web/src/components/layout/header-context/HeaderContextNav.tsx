'use client';

import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { HeaderNavItem } from './header-context-types';
import { HeaderContextBridgeNav } from './HeaderContextBridgeNav';

export interface HeaderContextNavProps {
  items: HeaderNavItem[];
  ariaLabel: string;
  className?: string;
}

/** Desktop zone tabs. Mobile destinations are published to the module dock. */
export function HeaderContextNav({ items, ariaLabel, className }: HeaderContextNavProps) {
  const isMobileViewport = useIsMobileViewport();

  if (items.length === 0 || isMobileViewport) {
    return null;
  }

  return <HeaderContextBridgeNav items={items} ariaLabel={ariaLabel} className={className} />;
}
