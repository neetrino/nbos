'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/permissions';
import { NAV_MODULE_DEFINITIONS } from '@/lib/navigation/nav-config';
import { getVisibleNavModules } from '@/lib/navigation/nav-visibility';
import { useModuleEntryHref } from '@/lib/navigation/hooks/use-module-entry-href';
import { SIDEBAR_MODULE_VISUALS } from './sidebar-module-visual';
import {
  MOBILE_DOCK_HEIGHT_CLASS,
  MOBILE_DOCK_ITEM_CLASS,
  pickMobileDockKeys,
} from './mobile-bottom-nav-constants';

interface MobileBottomNavProps {
  menuOpen?: boolean;
  onMoreClick: () => void;
}

export function MobileBottomNav({ menuOpen = false, onMoreClick }: MobileBottomNavProps) {
  const { can, isLoading } = usePermission();
  const visibleModules = useMemo(
    () => getVisibleNavModules(can, isLoading, NAV_MODULE_DEFINITIONS),
    [can, isLoading],
  );
  const dockKeys = useMemo(
    () => pickMobileDockKeys(visibleModules.map((item) => item.key)),
    [visibleModules],
  );

  return (
    <nav className="nbos-mobile-dock md:hidden" aria-label="Primary mobile navigation">
      <div className={cn('flex items-stretch gap-1 px-2', MOBILE_DOCK_HEIGHT_CLASS)}>
        {dockKeys.map((key) => {
          const item = visibleModules.find((module) => module.key === key);
          if (!item) return null;
          return <MobileDockLink key={key} href={item.href} label={item.label} moduleKey={key} />;
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className={cn(
            MOBILE_DOCK_ITEM_CLASS,
            menuOpen
              ? 'bg-primary/12 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
          )}
          aria-expanded={menuOpen}
        >
          <LayoutGrid size={18} aria-hidden />
          More
        </button>
      </div>
    </nav>
  );
}

function MobileDockLink({
  href,
  label,
  moduleKey,
}: {
  href: string;
  label: string;
  moduleKey: (typeof NAV_MODULE_DEFINITIONS)[number]['key'];
}) {
  const pathname = usePathname();
  const entryHref = useModuleEntryHref(moduleKey, href, pathname);
  const { Icon } = SIDEBAR_MODULE_VISUALS[moduleKey];
  const active = pathname === entryHref || pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <Link
      href={entryHref}
      aria-current={active ? 'page' : undefined}
      className={cn(
        MOBILE_DOCK_ITEM_CLASS,
        active
          ? 'bg-primary/12 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}
