'use client';

import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { HeaderNavItem } from './header-context-types';
import { HeaderContextBridgeNav } from './HeaderContextBridgeNav';
import { HeaderContextMobileNav } from './HeaderContextMobileNav';

export interface HeaderContextNavProps {
  items: HeaderNavItem[];
  ariaLabel: string;
  className?: string;
}

/** Desktop zone tabs; mobile renders a top pill switcher. */
export function HeaderContextNav({ items, ariaLabel, className }: HeaderContextNavProps) {
  const isMobileViewport = useIsMobileViewport();

  if (items.length === 0) {
    return null;
  }

  if (isMobileViewport) {
    return <HeaderContextMobileNav items={items} ariaLabel={ariaLabel} className={className} />;
  }

  return <HeaderContextBridgeNav items={items} ariaLabel={ariaLabel} className={className} />;
}
