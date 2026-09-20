'use client';

import type { ReactNode } from 'react';
import { Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import {
  DataView,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeroSearch,
} from '@/components/shared';
import {
  FUNCTION_CATALOG_ALL_ID,
  FUNCTION_CATALOG_RAIL_GRID_CLASS,
} from './function-catalog.constants';
import {
  FunctionCatalogCategoryBlocks,
  type FunctionCatalogBrowserMode,
} from './function-catalog-blocks';
import type { CatalogRailId } from './function-catalog-grouping';
import { FunctionCatalogRail } from './function-catalog-rail';
import { useCatalogBrowserModel } from './use-catalog-browser-model';

type FunctionCatalogBrowserProps = {
  items: DeliveryFunctionOperationalDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: CatalogRailId;
  onSelectCategory: (id: CatalogRailId) => void;
  unitsByFunctionId: Map<string, number> | undefined;
  mode: FunctionCatalogBrowserMode;
  headerAction?: ReactNode;
};

export function FunctionCatalogBrowser({
  items,
  loading,
  error,
  onRetry,
  search,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  unitsByFunctionId,
  mode,
  headerAction,
}: FunctionCatalogBrowserProps) {
  const t = useTranslations('hr.functionCatalog');
  const model = useCatalogBrowserModel(items, search, selectedCategory);
  return (
    <div className={FUNCTION_CATALOG_RAIL_GRID_CLASS}>
      <FunctionCatalogRail
        entries={model.rail}
        selectedId={selectedCategory}
        onSelect={onSelectCategory}
      />
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PageHeroSearch
            value={search}
            onChange={onSearchChange}
            placeholder={t('search')}
            className="w-full min-w-0 flex-1"
          />
          {headerAction}
        </div>
        <CatalogBrowserData
          items={items}
          loading={loading}
          error={error}
          onRetry={onRetry}
          search={search}
          selectedCategory={selectedCategory}
          hasCards={model.hasCards}
          blocks={model.blocks}
          mode={mode}
          unitsByFunctionId={unitsByFunctionId}
        />
      </div>
    </div>
  );
}

type CatalogBrowserDataProps = {
  items: DeliveryFunctionOperationalDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  search: string;
  selectedCategory: CatalogRailId;
  hasCards: boolean;
  blocks: ReturnType<typeof useCatalogBrowserModel>['blocks'];
  mode: FunctionCatalogBrowserMode;
  unitsByFunctionId: Map<string, number> | undefined;
};

function CatalogBrowserData({
  items,
  loading,
  error,
  onRetry,
  search,
  selectedCategory,
  hasCards,
  blocks,
  mode,
  unitsByFunctionId,
}: CatalogBrowserDataProps) {
  const t = useTranslations('hr.functionCatalog');
  const emptyTitle = search.trim() ? t('emptySearch') : t('empty');
  return (
    <DataView
      loading={loading}
      error={error}
      hasData={items.length > 0}
      loadingFallback={<LoadingState variant="cards" />}
      errorFallback={<ErrorState description={error ?? t('loadFailed')} onRetry={onRetry} />}
      emptyFallback={<EmptyState icon={Layers} title={emptyTitle} />}
    >
      {hasCards ? (
        <FunctionCatalogCategoryBlocks
          blocks={blocks}
          mode={mode}
          unitsByFunctionId={unitsByFunctionId}
          formatUnits={(total) => t('unitsCount', { count: total })}
        />
      ) : (
        <EmptyState
          icon={Layers}
          title={selectedCategory === FUNCTION_CATALOG_ALL_ID ? emptyTitle : t('empty')}
        />
      )}
    </DataView>
  );
}
