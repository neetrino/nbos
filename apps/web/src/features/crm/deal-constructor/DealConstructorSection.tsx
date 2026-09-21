'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FunctionCatalogBrowser } from '@/features/function-catalog/function-catalog-browser';
import { FUNCTION_CATALOG_ALL_ID } from '@/features/function-catalog/function-catalog.constants';
import { type CatalogRailId } from '@/features/function-catalog/function-catalog-grouping';
import { canShowDealConstructor } from './can-show-deal-constructor';
import { DealConstructorCollections } from './DealConstructorCollections';
import { DealConstructorTotals } from './DealConstructorTotals';
import { useDealConstructor } from './use-deal-constructor';

export function DealConstructorSection({
  deal,
  productType,
  disabled,
}: {
  deal: Parameters<typeof canShowDealConstructor>[0] & { id: string };
  productType: string | null;
  disabled: boolean;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  if (!canShowDealConstructor({ ...deal, productType })) {
    return null;
  }
  return (
    <DealConstructorBody
      dealId={deal.id}
      productType={productType!}
      disabled={disabled}
      title={t('title')}
    />
  );
}

function DealConstructorBody({
  dealId,
  productType,
  disabled,
  title,
}: {
  dealId: string;
  productType: string;
  disabled: boolean;
  title: string;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const model = useDealConstructor(dealId, productType);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CatalogRailId>(FUNCTION_CATALOG_ALL_ID);
  const selectedIds = new Set(model.quote?.items.map((item) => item.functionId) ?? []);

  return (
    <section className="border-border bg-card space-y-4 rounded-2xl border p-5">
      <div className="space-y-1">
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>
      {model.error ? <p className="text-destructive text-sm">{model.error}</p> : null}
      <DealConstructorTotals
        saleTotal={model.saleTotal}
        unitsTotal={model.unitsTotal}
        canSeeUnits={model.canSeeUnits}
      />
      <DealConstructorCollections
        collections={model.collections}
        appliedCollectionId={model.quote?.appliedCollectionId ?? null}
        disabled={disabled || model.saving}
        onApply={(collectionId) => void model.applyCollection(collectionId)}
      />
      <FunctionCatalogBrowser
        items={model.catalog.items}
        loading={model.catalog.loading}
        error={model.catalog.error}
        onRetry={() => void model.catalog.reload()}
        search={search}
        onSearchChange={setSearch}
        selectedCategory={category}
        onSelectCategory={setCategory}
        unitsByFunctionId={model.canSeeUnits ? model.catalog.unitsByFunctionId : undefined}
        salePriceByFunctionId={model.catalog.salePriceByFunctionId}
        mode={{
          kind: 'pick',
          selectedIds,
          alreadyAddedIds: new Set(),
          onToggle: disabled ? () => undefined : model.toggle,
          gradationByFunctionId: Object.fromEntries(
            (model.quote?.items ?? [])
              .filter((item) => item.tierId)
              .map((item) => [item.functionId, item.tierId as string]),
          ),
          onSelectGradation: disabled ? () => undefined : model.selectGradation,
        }}
      />
    </section>
  );
}
