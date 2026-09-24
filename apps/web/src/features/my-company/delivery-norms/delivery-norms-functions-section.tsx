'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FUNCTION_CATALOG_MODULE } from '@nbos/shared';
import type { DeliveryFunctionPriceFinancialDto } from '@nbos/shared';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { CreateFunctionDraftForm } from '@/features/function-catalog/create-function-draft-form';
import { FunctionCatalogBrowser } from '@/features/function-catalog/function-catalog-browser';
import { FunctionCatalogDetailSheet } from '@/features/function-catalog/function-catalog-detail-sheet';
import { FUNCTION_CATALOG_ALL_ID } from '@/features/function-catalog/function-catalog.constants';
import {
  isCatalogRailId,
  type CatalogRailId,
} from '@/features/function-catalog/function-catalog-grouping';
import { useFunctionCatalogQuery } from '@/features/function-catalog/use-function-catalog-query';
import { useFunctionSheetDetail } from '@/features/function-catalog/use-function-sheet-detail';
import { usePermission } from '@/lib/permissions';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';

export function DeliveryNormsFunctionsSection({
  canSeeCatalog,
  canSeeRules,
  canAdd,
  canPublish,
  prices,
  salePrices,
  onRulesChanged,
  onError,
}: {
  canSeeCatalog: boolean;
  canSeeRules: boolean;
  canAdd: boolean;
  canPublish: boolean;
  prices: DeliveryFunctionPriceFinancialDto[];
  salePrices: SalePriceVersionDto[];
  onRulesChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const canEditCatalog =
    can('ADD', FUNCTION_CATALOG_MODULE) || can('EDIT', FUNCTION_CATALOG_MODULE);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [selectedCategory, setSelectedCategory] = useState<CatalogRailId>(FUNCTION_CATALOG_ALL_ID);
  const [openId, setOpenId] = useState<string | null>(null);
  const catalog = useFunctionCatalogQuery({
    search: debouncedSearch,
    category: selectedCategory,
  });
  const selectedCard = useMemo(
    () => catalog.items.find((item) => item.id === openId) ?? null,
    [catalog.items, openId],
  );
  const selected = useFunctionSheetDetail(openId, selectedCard);

  if (!canSeeCatalog && !canSeeRules) {
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-muted-foreground max-w-3xl text-sm">{t('subtitle')}</p>
        {canEditCatalog ? (
          <CreateFunctionDraftForm
            onCreated={() => {
              void catalog.reload();
            }}
          />
        ) : null}
      </div>
      <FunctionCatalogBrowser
        items={catalog.items}
        loading={catalog.loading}
        error={catalog.error}
        onRetry={() => void catalog.reload()}
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => {
          if (isCatalogRailId(id)) setSelectedCategory(id);
        }}
        unitsByFunctionId={catalog.unitsByFunctionId}
        salePriceByFunctionId={catalog.salePriceByFunctionId}
        total={catalog.total}
        categoryCounts={catalog.categoryCounts}
        hasMore={catalog.hasMore}
        loadingMore={catalog.loadingMore}
        onLoadMore={() => void catalog.loadMore()}
        mode={{ kind: 'browse', showStatus: canEditCatalog, onOpen: setOpenId }}
      />
      <FunctionCatalogDetailSheet
        item={selected}
        prices={prices}
        salePrices={salePrices}
        canSeeRules={canSeeRules}
        canAdd={canAdd}
        canPublish={canPublish}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onChanged={() => {
          void catalog.reload();
          onRulesChanged();
        }}
        onError={onError}
      />
    </div>
  );
}
