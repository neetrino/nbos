'use client';

import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { MessengerClient } from '@/features/messenger/MessengerClient';
import { cn } from '@/lib/utils';
import {
  PORTFOLIO_QUICK_ACTION_SHEET_CONTENT_CLASS,
  PORTFOLIO_QUICK_ACTION_SHEET_RAIL_ANCHOR_CLASS,
  PORTFOLIO_QUICK_ACTION_SHEET_WIDTH_CLASS,
} from './portfolio-quick-action-sheet-layout';

export function PortfolioMessengerSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        stackAboveEntitySheet
        sourcePageHref="/messenger"
        showRailActions={false}
        contentClassName={cn(
          PORTFOLIO_QUICK_ACTION_SHEET_CONTENT_CLASS,
          PORTFOLIO_QUICK_ACTION_SHEET_WIDTH_CLASS,
        )}
        railAnchorClassName={PORTFOLIO_QUICK_ACTION_SHEET_RAIL_ANCHOR_CLASS}
        className="flex min-h-0 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col px-3 pt-2 pb-3">
          <MessengerClient embedded />
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
