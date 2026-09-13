'use client';

import { Plus, Receipt } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { useExpensePlansT } from './expense-plan-message-keys';

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
  const t = useExpensePlansT();
  const cardCount = plan._count.expenses;
  const body =
    plan.status === 'CANCELLED'
      ? t('cardsTab.stopped')
      : cardCount > 0
        ? t('cardsTab.linked', { count: cardCount })
        : t('cardsTab.empty');

  return (
    <DetailSheetSection
      title={t('cardsTab.title')}
      icon={<Receipt size={12} />}
      titleTrailing={
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button type="button" size="sm" onClick={onGenerateClick} disabled={generateDisabled}>
            <Plus size={14} aria-hidden />
            {t('cardsTab.generate')}
          </Button>
        </div>
      }
      titleRowClassName="flex-nowrap"
    >
      <p className="text-muted-foreground text-sm">{body}</p>
    </DetailSheetSection>
  );
}
