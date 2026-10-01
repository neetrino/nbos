'use client';

import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { ClientMessengerApp } from '@/features/messenger-client/ClientMessengerApp';
import type { PortfolioClientTarget } from '@/features/messenger-client/use-portfolio-client-scope';
import { cn } from '@/lib/utils';
import {
  PORTFOLIO_QUICK_ACTION_SHEET_CONTENT_CLASS,
  PORTFOLIO_QUICK_ACTION_SHEET_RAIL_ANCHOR_CLASS,
  PORTFOLIO_QUICK_ACTION_SHEET_WIDTH_CLASS,
} from './portfolio-quick-action-sheet-layout';

export function PortfolioMessengerSheet({
  open,
  onOpenChange,
  portfolio,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: PortfolioClientTarget;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        stackAboveEntitySheet
        sourcePageHref="/client-messenger"
        showRailActions={false}
        contentClassName={cn(
          PORTFOLIO_QUICK_ACTION_SHEET_CONTENT_CLASS,
          PORTFOLIO_QUICK_ACTION_SHEET_WIDTH_CLASS,
        )}
        railAnchorClassName={PORTFOLIO_QUICK_ACTION_SHEET_RAIL_ANCHOR_CLASS}
        className="flex min-h-0 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col px-3 pt-2 pb-3">
          {open ? <ClientMessengerApp embedded portfolio={portfolio} /> : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
