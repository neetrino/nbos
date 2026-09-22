'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import {
  FUNCTION_CATALOG_ALL_ID,
  FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS,
} from '@/features/function-catalog/function-catalog.constants';
import {
  isCatalogRailId,
  type CatalogRailId,
} from '@/features/function-catalog/function-catalog-grouping';
import { useCatalogBrowserModel } from '@/features/function-catalog/use-catalog-browser-model';
import { formatUnitSum, UNIT_SUM_EMPTY } from './format-unit-sum';
import {
  functionUnitCardModel,
  pairsForFunction,
  type FunctionUnitCardModel,
} from './function-unit-focus';
import type { LiveFunctionPrice } from './live-function-prices';
import { NormsCatalogCard } from './norms-catalog-card';
import { NormsCategoryBrowser, type NormsRailEntry } from './norms-category-browser';
import { normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';

export function FunctionUnitsBrowser({
  catalog,
  pairs,
  canAdd,
  canPublish,
  onOpen,
  onChanged,
  onError,
}: {
  catalog: DeliveryFunctionOperationalDto[];
  pairs: LiveFunctionPrice[];
  canAdd: boolean;
  canPublish: boolean;
  onOpen: (functionId: string) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const view = useFunctionUnitsView(catalog, pairs);
  return (
    <NormsCategoryBrowser
      railTitle={view.railTitle}
      entries={view.entries}
      selectedId={view.category}
      onSelect={view.selectCategory}
      search={view.query}
      onSearchChange={view.setQuery}
      searchPlaceholder={view.searchPlaceholder}
      blocks={view.blocks}
      emptyLabel={view.emptyLabel}
      itemKey={(item) => item.id}
      renderItem={(item) => (
        <FunctionUnitCard
          item={item}
          canAdd={canAdd}
          canPublish={canPublish}
          unitsLabel={view.unitsLabel(item.unitsTotal)}
          onOpen={() => onOpen(item.id)}
          onChanged={onChanged}
          onError={onError}
        />
      )}
    />
  );
}

function useFunctionUnitsView(
  catalog: DeliveryFunctionOperationalDto[],
  pairs: LiveFunctionPrice[],
) {
  const t = useTranslations('hr.deliveryNorms');
  const tCatalog = useTranslations('hr.functionCatalog');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CatalogRailId>(FUNCTION_CATALOG_ALL_ID);
  const model = useCatalogBrowserModel(catalog, query, category);
  const blocks = useMemo(
    () => categoryBlocks(model.blocks, pairs, tCatalog),
    [model.blocks, pairs, tCatalog],
  );
  return {
    railTitle: tCatalog('categoriesRail'),
    entries: railEntries(model.rail, tCatalog),
    category,
    selectCategory: (id: string) => {
      if (isCatalogRailId(id)) setCategory(id);
    },
    query,
    setQuery,
    searchPlaceholder: tCatalog('search'),
    blocks,
    emptyLabel: query.trim() ? t('search.empty') : t('prices.empty'),
    unitsLabel: (total: string | null) =>
      unitsLabel(total, (count) => tCatalog('unitsCount', { count })),
  };
}

function categoryBlocks(
  blocks: ReturnType<typeof useCatalogBrowserModel>['blocks'],
  pairs: LiveFunctionPrice[],
  tCatalog: ReturnType<typeof useTranslations<'hr.functionCatalog'>>,
) {
  return blocks.map((block) => ({
    id: block.id,
    label: tCatalog(FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS[block.id]),
    items: block.items.map((item) => functionUnitCardModel(item, pairsForFunction(pairs, item.id))),
  }));
}

function railEntries(
  rail: ReturnType<typeof useCatalogBrowserModel>['rail'],
  tCatalog: ReturnType<typeof useTranslations<'hr.functionCatalog'>>,
): NormsRailEntry[] {
  return rail.map((entry) => ({
    id: entry.id,
    label: tCatalog(FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS[entry.id]),
    count: entry.count,
  }));
}

function unitsLabel(total: string | null, formatCount: (count: number) => string): string {
  if (total === null) return UNIT_SUM_EMPTY;
  const formatted = formatUnitSum(total);
  if (!/^\d+$/u.test(formatted)) return formatted;
  return formatCount(Number(formatted));
}

function FunctionUnitCard({
  item,
  canAdd,
  canPublish,
  unitsLabel: units,
  onOpen,
  onChanged,
  onError,
}: {
  item: FunctionUnitCardModel;
  canAdd: boolean;
  canPublish: boolean;
  unitsLabel: string;
  onOpen: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const statusLabel = item.status ? t(normativeStatusLabelKey(item.status)) : null;
  return (
    <NormsCatalogCard
      title={item.title}
      iconKey={item.iconKey}
      unitsLabel={units}
      status={item.status}
      statusLabel={statusLabel}
      canOpen={item.draftId ? canPublish : canAdd}
      onOpen={onOpen}
      publish={
        item.draftId && canPublish && item.draftRoleUnits ? (
          <PublishDraftButton
            roleUnits={item.draftRoleUnits}
            onPublish={async (confirmZeroUnits) => {
              await deliveryNormsApi.publishFunctionPrice(item.draftId ?? '', { confirmZeroUnits });
            }}
            onError={onError}
            onPublished={onChanged}
          />
        ) : null
      }
    />
  );
}
