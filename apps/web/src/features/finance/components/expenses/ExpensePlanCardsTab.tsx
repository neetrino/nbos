'use client';

import { Receipt } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import type { ExpensePlan } from '@/lib/api/expense-plans';

export function ExpensePlanCardsTab({ plan }: { plan: ExpensePlan }) {
  return (
    <DetailSheetSection title="Expense cards" icon={<Receipt size={12} />}>
      <p className="text-muted-foreground text-sm">
        Cards generated from this plan appear on the pay now board. Open the filtered list to review
        or pay them.
      </p>
    </DetailSheetSection>
  );
}
