'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { FunctionCatalogBrowser } from './function-catalog-browser';
import { FunctionCatalogCollections } from './function-catalog-collections';
import type { FunctionCatalogBrowserMode } from './function-catalog-blocks';
import { FUNCTION_CATALOG_ALL_ID } from './function-catalog.constants';
import type { CatalogRailId } from './function-catalog-grouping';
import type { VisibleSalePrice } from './function-catalog-sale-price';
import type { FunctionCollectionDto } from '@/lib/api/delivery-catalog-structure';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';

type FunctionCatalogSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DeliveryFunctionOperationalDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  unitsByFunctionId: Map<string, number> | undefined;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  mode: FunctionCatalogBrowserMode;
  footer?: ReactNode;
  collections?: readonly FunctionCollectionDto[];
  appliedCollectionId?: string | null;
  onApplyCollection?: (collectionId: string) => void;
  collectionsDisabled?: boolean;
};

export function FunctionCatalogSheet({
  open,
  onOpenChange,
  items,
  loading,
  error,
  onRetry,
  unitsByFunctionId,
  salePriceByFunctionId,
  mode,
  footer,
  collections,
  appliedCollectionId,
  onApplyCollection,
  collectionsDisabled,
}: FunctionCatalogSheetProps) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CatalogRailId>(FUNCTION_CATALOG_ALL_ID);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="wide"
        forceNestedBackdrop
        stackAboveEntitySheet
      >
        <div className="flex h-full min-h-0 flex-col gap-5 p-6">
          <h2 className="text-foreground text-lg font-semibold">{t('catalogSheet')}</h2>
          {collections && onApplyCollection ? (
            <FunctionCatalogCollections
              collections={collections}
              appliedCollectionId={appliedCollectionId ?? null}
              disabled={collectionsDisabled === true}
              onApply={onApplyCollection}
            />
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FunctionCatalogBrowser
              items={items}
              loading={loading}
              error={error}
              onRetry={onRetry}
              search={search}
              onSearchChange={setSearch}
              selectedCategory={category}
              onSelectCategory={setCategory}
              unitsByFunctionId={unitsByFunctionId}
              salePriceByFunctionId={salePriceByFunctionId}
              mode={mode}
            />
          </div>
          {footer}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
