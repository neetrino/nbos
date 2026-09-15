'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, Receipt } from 'lucide-react';
import {
  DetailSheetSection,
  EntityItemList,
  ErrorState,
  LoadingState,
  useOpenEntityItemFromSummary,
  useEntityItemMobileView,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { planExpensesDrilldownHref } from '@/features/finance/constants/project-expenses-drilldown';
import { expensePreviewToItemSummary } from '@/features/finance/entity-item/expense-item-summary';
import { useExpensePlanLinkedCards } from '@/features/finance/hooks/use-expense-plan-linked-cards';
import { cn } from '@/lib/utils';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { useExpensePlansT } from './expense-plan-message-keys';

interface ExpensePlanCardsTabProps {
  plan: ExpensePlan;
  refreshNonce: number;
  onGenerateClick: () => void;
  onCreateClick: () => void;
  generateDisabled?: boolean;
  createDisabled?: boolean;
}

export function ExpensePlanCardsTab({
  plan,
  refreshNonce,
  onGenerateClick,
  onCreateClick,
  generateDisabled = false,
  createDisabled = false,
}: ExpensePlanCardsTabProps) {
  const t = useExpensePlansT();
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const displayVariant = useEntityItemMobileView(viewVariant);
  const { items, loading, error, reload } = useExpensePlanLinkedCards(plan.id, refreshNonce);

  const itemSummaries = useMemo(
    () =>
      items.map((row) =>
        expensePreviewToItemSummary({
          id: row.id,
          name: row.name,
          status: row.status,
          amount: row.amount,
          category: row.category,
          dueDate: row.dueDate,
        }),
      ),
    [items],
  );

  const stopped = plan.status === 'CANCELLED';

  return (
    <DetailSheetSection
      title={t('cardsTab.title')}
      icon={<Receipt size={12} />}
      titleTrailing={
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button type="button" size="sm" onClick={onCreateClick} disabled={createDisabled}>
            <Plus size={14} aria-hidden />
            {t('cardsTab.create')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onGenerateClick}
            disabled={generateDisabled}
          >
            {t('cardsTab.generate')}
          </Button>
          <ViewModeSwitch
            value={viewVariant}
            onChange={setViewVariant}
            options={ENTITY_ITEM_VIEW_OPTIONS}
            ariaLabel={t('cardsTab.viewAria')}
          />
        </div>
      }
      titleRowClassName="flex-nowrap"
    >
      {stopped ? (
        <p className="text-muted-foreground mb-4 text-sm">{t('cardsTab.stopped')}</p>
      ) : null}
      {loading ? <LoadingState count={3} /> : null}
      {error ? <ErrorState description={t('cardsTab.loadError')} onRetry={reload} /> : null}
      {!loading && !error ? (
        <EntityItemList
          items={itemSummaries}
          variant={displayVariant}
          onOpen={onOpenItem}
          emptyIcon={Receipt}
          emptyTitle={t('cardsTab.emptyTitle')}
          emptyDescription={t('cardsTab.empty')}
        />
      ) : null}

      {items.length > 0 ? (
        <Link
          href={planExpensesDrilldownHref(plan.id)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 gap-1.5')}
        >
          <Receipt size={14} aria-hidden />
          {t('cardsTab.openBoard')}
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      ) : null}
    </DetailSheetSection>
  );
}
