'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { MOBILE_APP_MENU_HANDLE_CLASS, MOBILE_APP_MENU_SHEET_CLASS } from './mobile-app-menu-constants';
import type { MobileDockItem } from './mobile-module-dock-types';

interface MobileDockOverflowSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MobileDockItem[];
  title?: string;
}

export function MobileDockOverflowSheet({
  open,
  onOpenChange,
  items,
  title = 'More',
}: MobileDockOverflowSheetProps) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className={MOBILE_APP_MENU_SHEET_CLASS}>
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">Additional sections for the current module.</SheetDescription>
        <span className={MOBILE_APP_MENU_HANDLE_CLASS} aria-hidden />
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <p className="text-foreground text-lg font-semibold tracking-tight">{title}</p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-full"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <ul className="flex flex-col gap-1 px-4 pb-5">
          {items.map((item) => (
            <li key={item.id}>
              <OverflowDockRow item={item} onNavigate={close} />
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

function OverflowDockRow({ item, onNavigate }: { item: MobileDockItem; onNavigate: () => void }) {
  const Icon = item.icon;
  const className = cn(
    'flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold',
    item.active ? 'bg-sidebar-accent text-foreground' : 'text-foreground hover:bg-muted',
  );

  if (item.href) {
    return (
      <Link href={item.href} onClick={onNavigate} className={className} aria-current={item.active ? 'page' : undefined}>
        {Icon ? <Icon size={18} aria-hidden /> : null}
        {item.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-current={item.active ? 'page' : undefined}
      onClick={() => {
        item.onSelect?.();
        onNavigate();
      }}
    >
      {Icon ? <Icon size={18} aria-hidden /> : null}
      {item.label}
    </button>
  );
}
