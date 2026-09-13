'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, Receipt } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DetailSheetSection,
  EntityItemList,
  useOpenEntityItemFromSummary,
  useEntityItemMobileView,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { OPEN_EXPENSE_QUERY } from '@/features/finance/constants/expense-deep-link';
import { clientServiceExpenseLinkToItemSummary } from '@/features/finance/entity-item/client-service-finance-item-summary';
import type { ClientServiceFinanceLinks } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';
import { useClientServicesT } from './client-service-message-keys';

interface ClientServiceExpensesTabProps {
  links: ClientServiceFinanceLinks | undefined;
  canCreate?: boolean;
  onCreateExpense: () => void;
}

export function ClientServiceExpensesTab({
  links,
  canCreate = true,
  onCreateExpense,
}: ClientServiceExpensesTabProps) {
  const t = useClientServicesT();
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const displayVariant = useEntityItemMobileView(viewVariant);
  const expenses = useMemo(() => links?.expenses ?? [], [links?.expenses]);

  const itemSummaries = useMemo(
    () => expenses.map((row) => clientServiceExpenseLinkToItemSummary(row)),
    [expenses],
  );

  return (
    <DetailSheetSection title={t('expensesTab.title')} icon={<Receipt size={12} />}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {canCreate ? (
          <Button type="button" size="sm" onClick={onCreateExpense}>
            <Plus size={14} aria-hidden />
            {t('expensesTab.create')}
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">{t('expensesTab.reminderOnly')}</p>
        )}
        <ViewModeSwitch
          value={viewVariant}
          onChange={setViewVariant}
          options={ENTITY_ITEM_VIEW_OPTIONS}
          ariaLabel={t('expensesTab.viewAria')}
        />
      </div>

      <EntityItemList
        items={itemSummaries}
        variant={displayVariant}
        onOpen={onOpenItem}
        emptyIcon={Receipt}
        emptyTitle={t('expensesTab.emptyTitle')}
        emptyDescription={t('expensesTab.emptyDescription')}
      />

      {expenses[0] ? (
        <Link
          href={`/finance/expenses?${OPEN_EXPENSE_QUERY}=${encodeURIComponent(expenses[0].id)}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 gap-1.5')}
        >
          <Receipt size={14} aria-hidden />
          {t('expensesTab.openFinance')}
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      ) : null}
    </DetailSheetSection>
  );
}
