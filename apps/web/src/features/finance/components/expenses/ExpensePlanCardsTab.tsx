'use client';

import { Plus, Receipt } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { ExpensePlan } from '@/lib/api/expense-plans';

interface ExpensePlanCardsTabProps {
  plan: ExpensePlan;
  onGenerateClick: () => void;
  generateDisabled?: boolean;
}

export function ExpensePlanCardsTab({
  plan,
  onGenerateClick,
  generateDisabled = false,
}: ExpensePlanCardsTabProps) {
  const cardCount = plan._count.expenses;

  return (
    <DetailSheetSection
      title="Expense cards"
      icon={<Receipt size={12} />}
      titleTrailing={
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button type="button" size="sm" onClick={onGenerateClick} disabled={generateDisabled}>
            <Plus size={14} aria-hidden />
            Generate card
          </Button>
        </div>
      }
      titleRowClassName="flex-nowrap"
    >
      <p className="text-muted-foreground text-sm">
        {plan.status === 'CANCELLED'
          ? 'This plan is stopped. Existing cards stay on the pay now board; resume the plan to generate new ones.'
          : cardCount > 0
            ? `${cardCount} card${cardCount === 1 ? '' : 's'} linked to this plan. Open the pay now board to review or pay them.`
            : 'No cards generated yet. Use Generate to create an expense card from this plan.'}
      </p>
    </DetailSheetSection>
  );
}
