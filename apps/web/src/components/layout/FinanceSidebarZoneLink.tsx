'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SIDEBAR_NAV_CHILD_LINK_CLASS } from './sidebar-layout-constants';
import type { FinanceSidebarZoneId } from '@/features/finance/constants/finance-zone-storage';
import { isFinanceZonePath } from '@/features/finance/constants/finance-zone-storage';
import { useFinanceZoneHref } from '@/features/finance/hooks/use-finance-zone-href';

type FinanceSidebarZoneLinkProps = {
  zone: FinanceSidebarZoneId;
  label: string;
  pathname: string;
};

export function FinanceSidebarZoneLink({ zone, label, pathname }: FinanceSidebarZoneLinkProps) {
  const href = useFinanceZoneHref(zone, pathname);
  const active = isFinanceZonePath(pathname, zone);

  return (
    <li>
      <Link
        href={href}
        className={cn(
          SIDEBAR_NAV_CHILD_LINK_CLASS,
          active
            ? 'text-sidebar-foreground font-medium'
            : 'text-sidebar-muted hover:text-sidebar-foreground',
        )}
      >
        {label}
      </Link>
    </li>
  );
}
