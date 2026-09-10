'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { BottomSheetSwipeHandle } from './BottomSheetSwipeHandle';
import { BOTTOM_SHEET_SWIPE_PANEL_CLASS } from './bottom-sheet-swipe';
import { MOBILE_APP_MENU_SHEET_CLASS } from './mobile-app-menu-constants';
import { MOBILE_DOCK_ITEM_CLASS } from './mobile-bottom-nav-constants';
import { MOBILE_WORKSPACE_SEARCH_LABEL } from './mobile-workspace-dock-constants';
import { useBottomSheetSwipeToClose } from './use-bottom-sheet-swipe-to-close';

interface MobilePageSearchSheetProps {
  search: ReactNode;
  label?: string;
}

export function MobilePageSearchSheet({
  search,
  label = MOBILE_WORKSPACE_SEARCH_LABEL,
}: MobilePageSearchSheetProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const handleRef = useBottomSheetSwipeToClose(open, close);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        className={cn(
          MOBILE_DOCK_ITEM_CLASS,
          open
            ? 'bg-primary/12 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
        )}
        aria-label="Search this page"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search size={18} aria-hidden />
        {label}
      </button>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(MOBILE_APP_MENU_SHEET_CLASS, BOTTOM_SHEET_SWIPE_PANEL_CLASS)}
        data-hero-tools-sheet=""
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <SheetDescription className="sr-only">Search and filter this list.</SheetDescription>
        <BottomSheetSwipeHandle handleRef={handleRef} />
        <div className="flex flex-col gap-3 px-4 pt-3 pb-5">
          <p className="text-foreground text-lg font-semibold tracking-tight">Search</p>
          <div data-hero-tools-sheet="">{search}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
