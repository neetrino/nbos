'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PAGE_SETTINGS_SHEET_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';

export interface PageSettingsSheetProps {
  title: string;
  description?: string;
  triggerAriaLabel?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Page-level settings: opens a right sheet (not a centered dialog). */
export function PageSettingsSheet({
  title,
  description,
  triggerAriaLabel = 'Page settings',
  children,
  open: openProp,
  onOpenChange,
}: PageSettingsSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) setUncontrolledOpen(next);
    },
    [onOpenChange, openProp],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={triggerAriaLabel}
            title={triggerAriaLabel}
            className={props.className}
          >
            <Settings className="size-4" aria-hidden />
          </Button>
        )}
      />
      <SheetContent
        side="right"
        floatingClose
        floatingRailVisible={open}
        floatingRailAnchorClassName={PAGE_SETTINGS_SHEET_FLOATING_RAIL_ANCHOR_CLASS}
        className="flex w-full flex-col gap-0 sm:max-w-md"
      >
        <SheetHeader className="border-border border-b pb-4">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
