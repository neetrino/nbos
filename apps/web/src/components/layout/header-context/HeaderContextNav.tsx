'use client';

import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { HeaderNavItem } from './header-context-types';
import { HeaderContextBridgeNav } from './HeaderContextBridgeNav';
import { HeaderContextMobileNav } from './HeaderContextMobileNav';

export interface HeaderContextNavProps {
  items: HeaderNavItem[];
  ariaLabel: string;
  className?: string;
  /** Defaults to compact pills. Finance uses desktop zone tabs on mobile too. */
  mobileVariant?: 'pills' | 'tabs';
  /** Stretch mobile pills across the row (CRM-style). */
  fullWidthOnMobile?: boolean;
}

/** Desktop zone tabs; mobile renders pills unless `mobileVariant` is `tabs`. */
export function HeaderContextNav({
  items,
  ariaLabel,
  className,
  mobileVariant = 'pills',
  fullWidthOnMobile = false,
}: HeaderContextNavProps) {
  const isMobileViewport = useIsMobileViewport();

  if (items.length === 0) {
    return null;
  }

  if (isMobileViewport && mobileVariant !== 'tabs') {
    return (
      <HeaderContextMobileNav
        items={items}
        ariaLabel={ariaLabel}
        className={className}
        fullWidth={fullWidthOnMobile}
      />
    );
  }

  return <HeaderContextBridgeNav items={items} ariaLabel={ariaLabel} className={className} />;
}
