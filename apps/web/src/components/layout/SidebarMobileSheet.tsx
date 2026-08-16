'use client';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { SIDEBAR_MOBILE_SHEET_CLASS } from './sidebar-layout-constants';

type SidebarMobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

/** Mobile left nav drawer — half width, flush edges; close via header burger / backdrop. */
export function SidebarMobileSheet({ open, onOpenChange, children }: SidebarMobileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" showCloseButton={false} className={SIDEBAR_MOBILE_SHEET_CLASS}>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Primary app modules and personal links
        </SheetDescription>
        <div className="border-sidebar-border bg-sidebar flex h-full flex-col overflow-x-hidden">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
