'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileModuleDockResolved } from './MobileModuleDockProvider';
import { MobileDockOverflowSheet } from './MobileDockOverflowSheet';
import { MobileWorkspaceDock } from './MobileWorkspaceDock';
import type { MobileDockItem } from './mobile-module-dock-types';
import { MOBILE_DOCK_HEIGHT_CLASS, MOBILE_DOCK_ITEM_CLASS } from './mobile-bottom-nav-constants';

interface MobileBottomNavProps {
  menuOpen?: boolean;
  onMoreClick: () => void;
}

export function MobileBottomNav({ menuOpen = false, onMoreClick }: MobileBottomNavProps) {
  const { layout, slots, overflow } = useMobileModuleDockResolved();
  const [overflowOpen, setOverflowOpen] = useState(false);

  if (layout === 'workspace') {
    return <MobileWorkspaceDock menuOpen={menuOpen} onMoreClick={onMoreClick} />;
  }

  return (
    <nav className="nbos-mobile-dock md:hidden" aria-label="Module navigation">
      <div className={cn('flex items-stretch gap-1 px-1.5', MOBILE_DOCK_HEIGHT_CLASS)}>
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
          Menu
        </button>
        {slots.map((item) => (
          <MobileDockSlot key={item.id} item={item} />
        ))}
        {overflow.length > 0 ? (
          <button
            type="button"
            onClick={() => setOverflowOpen(true)}
            className={cn(
              MOBILE_DOCK_ITEM_CLASS,
              overflowOpen || overflow.some((item) => item.active)
                ? 'bg-primary/12 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
            aria-expanded={overflowOpen}
          >
            <MoreHorizontal size={18} aria-hidden />
            More
          </button>
        ) : null}
      </div>
      <MobileDockOverflowSheet open={overflowOpen} onOpenChange={setOverflowOpen} items={overflow} />
    </nav>
  );
}

function MobileDockSlot({ item }: { item: MobileDockItem }) {
  const Icon = item.icon;
  const className = cn(
    MOBILE_DOCK_ITEM_CLASS,
    item.active
      ? 'bg-primary/12 text-primary'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
  );

  if (item.href) {
    return (
      <Link href={item.href} aria-current={item.active ? 'page' : undefined} className={className}>
        {Icon ? <Icon size={18} strokeWidth={item.active ? 2.2 : 1.8} aria-hidden /> : null}
        <span className="max-w-full truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-current={item.active ? 'page' : undefined}
      className={className}
      onClick={() => item.onSelect?.()}
    >
      {Icon ? <Icon size={18} strokeWidth={item.active ? 2.2 : 1.8} aria-hidden /> : null}
      <span className="max-w-full truncate">{item.label}</span>
    </button>
  );
}
