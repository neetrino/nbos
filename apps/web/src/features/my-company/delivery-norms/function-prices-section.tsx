'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  DeliveryFunctionOperationalDto,
  DeliveryFunctionPriceFinancialDto,
} from '@nbos/shared';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { DeliveryNormsSectionToolbar } from './delivery-norms-section-toolbar';
import { FunctionPriceCreateSheet } from './function-price-create-sheet';
import { FunctionPricesList } from './function-prices-list';
import { catalogFunctionSearchParts } from './group-catalog-functions';
import { itemsMatchingSearch } from './matches-norm-search';

export function FunctionPricesSection({
  rows,
  catalog,
  canAdd,
  canPublish,
  onChanged,
  onError,
  embedded = false,
}: {
  rows: DeliveryFunctionPriceFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const titles = useMemo(() => new Map(catalog.map((item) => [item.id, item] as const)), [catalog]);
  const filtered = useMemo(
    () =>
      itemsMatchingSearch(rows, query, (row) => {
        const item = titles.get(row.functionId);
        return item
          ? catalogFunctionSearchParts(item)
          : [row.functionId, t('prices.unknownFunction')];
      }),
    [query, rows, t, titles],
  );

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('prices.title')}
      description={embedded ? undefined : t('prices.subtitle')}
    >
      <DeliveryNormsSectionToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel={t('search.label')}
        searchPlaceholder={t('search.placeholder')}
        addLabel={t('add')}
        canAdd={canAdd}
        onAdd={() => setOpen(true)}
      />
      {canAdd ? (
        <FunctionPriceCreateSheet
          open={open}
          catalog={catalog}
          onOpenChange={setOpen}
          onCreated={onChanged}
          onError={onError}
        />
      ) : null}
      {query.trim() !== '' && filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('search.empty')}</p>
      ) : (
        <FunctionPricesList
          rows={filtered}
          catalog={catalog}
          canPublish={canPublish}
          onPublished={onChanged}
          onError={onError}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}
