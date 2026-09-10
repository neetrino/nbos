'use client';

import { useCallback, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { BottomSheetSwipeHandle } from './BottomSheetSwipeHandle';
import { BOTTOM_SHEET_SWIPE_PANEL_CLASS } from './bottom-sheet-swipe';
import { MOBILE_APP_MENU_SHEET_CLASS } from './mobile-app-menu-constants';
import { useBottomSheetSwipeToClose } from './use-bottom-sheet-swipe-to-close';

interface MobileDockFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  forceNestedBackdrop?: boolean;
  children: ReactNode;
}

/** Same bottom-sheet chrome as Search and Menu. */
export function MobileDockFormSheet({
  open,
  onOpenChange,
  title,
  description,
  forceNestedBackdrop = false,
  children,
}: MobileDockFormSheetProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const handleRef = useBottomSheetSwipeToClose(open, close);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        forceNestedBackdrop={forceNestedBackdrop}
        className={cn(MOBILE_APP_MENU_SHEET_CLASS, BOTTOM_SHEET_SWIPE_PANEL_CLASS)}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>
        <BottomSheetSwipeHandle handleRef={handleRef} />
        <div className="flex flex-col gap-3 px-4 pt-3 pb-5">
          <p className="text-foreground text-lg font-semibold tracking-tight">{title}</p>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
