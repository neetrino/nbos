'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { FunctionCatalogBrowser } from './function-catalog-browser';
import type { FunctionCatalogBrowserMode } from './function-catalog-blocks';
import { FUNCTION_CATALOG_ALL_ID } from './function-catalog.constants';
import type { CatalogRailId } from './function-catalog-grouping';
import type { VisibleSalePrice } from './function-catalog-sale-price';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';

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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DeliveryFunctionOperationalDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  unitsByFunctionId: Map<string, number> | undefined;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  mode: FunctionCatalogBrowserMode;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CatalogRailId>(FUNCTION_CATALOG_ALL_ID);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="full" width="wide" forceNestedBackdrop>
        <div className="flex h-full min-h-0 flex-col gap-4 p-6">
          <div>
            <h2 className="text-foreground text-lg font-semibold">{t('catalogSheet')}</h2>
          </div>
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
      </EntityDetailSheetContent>
    </Sheet>
  );
}
