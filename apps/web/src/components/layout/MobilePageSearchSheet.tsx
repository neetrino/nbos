'use client';

import { useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { MOBILE_APP_MENU_HANDLE_CLASS, MOBILE_APP_MENU_SHEET_CLASS } from './mobile-app-menu-constants';
import { MOBILE_DOCK_ITEM_CLASS } from './mobile-bottom-nav-constants';

interface MobilePageSearchSheetProps {
  search: ReactNode;
  variant?: 'header' | 'dock';
  label?: string;
}

export function MobilePageSearchSheet({
  search,
  variant = 'header',
  label = 'Search',
}: MobilePageSearchSheetProps) {
  const [open, setOpen] = useState(false);
  const isDock = variant === 'dock';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        className={
          isDock
            ? cn(
                MOBILE_DOCK_ITEM_CLASS,
                open
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
              )
            : 'text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-full'
        }
        aria-label="Search this page"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search size={18} aria-hidden />
        {isDock ? label : null}
      </button>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={MOBILE_APP_MENU_SHEET_CLASS}
        data-hero-tools-sheet=""
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <SheetDescription className="sr-only">Search and filter this list.</SheetDescription>
        <span className={MOBILE_APP_MENU_HANDLE_CLASS} aria-hidden />
        <div className="flex flex-col gap-3 px-4 pt-3 pb-5">
          <p className="text-foreground text-lg font-semibold tracking-tight">Search</p>
          <div data-hero-tools-sheet="">{search}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
