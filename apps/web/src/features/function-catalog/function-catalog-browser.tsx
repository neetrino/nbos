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
import { formatMoneyDram } from '@/lib/format/money';
import {
  FUNCTION_CATALOG_ALL_ID,
  FUNCTION_CATALOG_RAIL_GRID_CLASS,
} from './function-catalog.constants';
import {
  FunctionCatalogCategoryBlocks,
  type FunctionCatalogBrowserMode,
} from './function-catalog-blocks';
import type { CatalogRailId } from './function-catalog-grouping';
import type { VisibleSalePrice } from './function-catalog-sale-price';
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
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  mode: FunctionCatalogBrowserMode;
  headerAction?: ReactNode;
  belowSearch?: ReactNode;
};

export function FunctionCatalogBrowser(props: FunctionCatalogBrowserProps) {
  const t = useTranslations('hr.functionCatalog');
  const model = useCatalogBrowserModel(props.items, props.search, props.selectedCategory);
  return (
    <div className={FUNCTION_CATALOG_RAIL_GRID_CLASS}>
      <FunctionCatalogRail
        entries={model.rail}
        selectedId={props.selectedCategory}
        onSelect={props.onSelectCategory}
      />
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PageHeroSearch
            value={props.search}
            onChange={props.onSearchChange}
            placeholder={t('search')}
            className="w-full min-w-0 flex-1"
          />
          {props.headerAction}
        </div>
        {props.belowSearch}
        <CatalogBrowserData
          items={props.items}
          loading={props.loading}
          error={props.error}
          onRetry={props.onRetry}
          search={props.search}
          selectedCategory={props.selectedCategory}
          hasCards={model.hasCards}
          blocks={model.blocks}
          mode={props.mode}
          unitsByFunctionId={props.unitsByFunctionId}
          salePriceByFunctionId={props.salePriceByFunctionId}
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
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
};

function CatalogBrowserData(props: CatalogBrowserDataProps) {
  const t = useTranslations('hr.functionCatalog');
  const emptyTitle = props.search.trim() ? t('emptySearch') : t('empty');
  return (
    <DataView
      loading={props.loading}
      error={props.error}
      hasData={props.items.length > 0}
      loadingFallback={<LoadingState variant="cards" />}
      errorFallback={
        <ErrorState description={props.error ?? t('loadFailed')} onRetry={props.onRetry} />
      }
      emptyFallback={<EmptyState icon={Layers} title={emptyTitle} />}
    >
      {props.hasCards ? (
        <FunctionCatalogCategoryBlocks
          blocks={props.blocks}
          mode={props.mode}
          unitsByFunctionId={props.unitsByFunctionId}
          salePriceByFunctionId={props.salePriceByFunctionId}
          formatUnits={(total) => t('unitsCount', { count: total })}
          formatSalePrice={(amount) => formatMoneyDram(Number(amount))}
        />
      ) : (
        <EmptyState
          icon={Layers}
          title={props.selectedCategory === FUNCTION_CATALOG_ALL_ID ? emptyTitle : t('empty')}
        />
      )}
    </DataView>
  );
}
