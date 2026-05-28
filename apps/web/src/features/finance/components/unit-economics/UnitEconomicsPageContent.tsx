'use client';

import { BonusPoolsPageContent } from '@/features/finance/components/bonus/BonusPoolsPageContent';

/** Unit economics workspace — product/order financial state (bonuses, funding, costs). */
export function UnitEconomicsPageContent() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        Financial state per delivery product or extension: received funds, expenses, bonuses,
        available cash, and margin indicators.
      </p>
      <BonusPoolsPageContent documentTitle="Unit economics" />
    </div>
  );
}
