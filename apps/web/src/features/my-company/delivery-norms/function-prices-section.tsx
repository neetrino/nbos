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
import { FunctionPricesTable } from './function-prices-table';
import { catalogFunctionSearchParts } from './group-catalog-functions';
import { functionPriceTitleMap, liveFunctionPrices } from './live-function-prices';
import { itemsMatchingSearch } from './matches-norm-search';

type FunctionPricesSectionProps = {
  rows: DeliveryFunctionPriceFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
};

export function FunctionPricesSection({
  rows,
  catalog,
  canAdd,
  canPublish,
  onChanged,
  onError,
  embedded = false,
}: FunctionPricesSectionProps) {
  const t = useTranslations('hr.deliveryNorms');
  const list = useFunctionPricesList(rows, catalog);
  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('prices.title')}
      description={embedded ? undefined : t('prices.subtitle')}
    >
      <DeliveryNormsSectionToolbar
        query={list.query}
        onQueryChange={list.setQuery}
        searchLabel={t('search.label')}
        searchPlaceholder={t('search.placeholder')}
        addLabel={t('add')}
        canAdd={canAdd}
        onAdd={() => list.setOpen(true)}
      />
      {canAdd ? (
        <FunctionPriceCreateSheet
          open={list.open}
          catalog={catalog}
          onOpenChange={list.setOpen}
          onCreated={onChanged}
          onError={onError}
        />
      ) : null}
      {list.query.trim() !== '' && list.filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('search.empty')}</p>
      ) : (
        <FunctionPricesTable
          pairs={list.filtered}
          titles={list.titles}
          canAdd={canAdd}
          canPublish={canPublish}
          onChanged={onChanged}
          onError={onError}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}

function useFunctionPricesList(
  rows: DeliveryFunctionPriceFinancialDto[],
  catalog: DeliveryFunctionOperationalDto[],
) {
  const t = useTranslations('hr.deliveryNorms');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const pairs = useMemo(() => liveFunctionPrices(rows), [rows]);
  const titles = useMemo(
    () => functionPriceTitleMap(catalog, pairs, t('prices.unknownFunction')),
    [catalog, pairs, t],
  );
  const catalogById = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const filtered = useMemo(
    () => matchingFunctionPrices(pairs, query, catalogById, titles, t('prices.unknownFunction')),
    [catalogById, pairs, query, t, titles],
  );
  return { query, open, titles, filtered, setQuery, setOpen };
}

function matchingFunctionPrices(
  pairs: ReturnType<typeof liveFunctionPrices>,
  query: string,
  catalogById: Map<string, DeliveryFunctionOperationalDto>,
  titles: Map<string, string>,
  unknownTitle: string,
) {
  return itemsMatchingSearch(pairs, query, (pair) => {
    const item = catalogById.get(pair.functionId);
    return item
      ? [...catalogFunctionSearchParts(item), titles.get(pair.key) ?? '']
      : [titles.get(pair.key) ?? unknownTitle];
  });
}
