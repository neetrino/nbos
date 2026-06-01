'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, Receipt } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DetailSheetSection,
  EntityItemList,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { OPEN_EXPENSE_QUERY } from '@/features/finance/constants/expense-deep-link';
import { clientServiceExpenseLinkToItemSummary } from '@/features/finance/entity-item/client-service-finance-item-summary';
import type { ClientServiceFinanceLinks } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';

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
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const expenses = links?.expenses ?? [];

  const itemSummaries = useMemo(
    () => expenses.map((row) => clientServiceExpenseLinkToItemSummary(row)),
    [expenses],
  );

  return (
    <DetailSheetSection title="Expense cards" icon={<Receipt size={12} />}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {canCreate ? (
          <Button type="button" size="sm" onClick={onCreateExpense}>
            <Plus size={14} aria-hidden />
            Create expense
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">
            Reminder-only services do not use expenses.
          </p>
        )}
        <ViewModeSwitch
          value={viewVariant}
          onChange={setViewVariant}
          options={ENTITY_ITEM_VIEW_OPTIONS}
          ariaLabel="Expense list view"
        />
      </div>

      <EntityItemList
        items={itemSummaries}
        variant={viewVariant}
        onOpen={onOpenItem}
        emptyIcon={Receipt}
        emptyTitle="No expense cards"
        emptyDescription="No expense cards linked to this service yet."
      />

      {expenses[0] ? (
        <Link
          href={`/finance/expenses?${OPEN_EXPENSE_QUERY}=${encodeURIComponent(expenses[0].id)}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 gap-1.5')}
        >
          <Receipt size={14} aria-hidden />
          Open in Finance
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      ) : null}
    </DetailSheetSection>
  );
}
