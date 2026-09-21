'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FunctionCatalogSheet } from '@/features/function-catalog/function-catalog-sheet';
import { translateProductPlatformLabel, translateProductTypeLabel } from '../i18n/crm-copy';
import { canShowDealConstructor, isDealCompositionReady } from './can-show-deal-constructor';
import { DealCompositionCard } from './deal-composition-card';
import { ProductCompositionSheet } from './product-composition-sheet';
import { useDealConstructor } from './use-deal-constructor';

export function DealConstructorSection({
  deal,
  productCategory,
  productType,
  productPlatform,
  disabled,
}: {
  deal: Parameters<typeof canShowDealConstructor>[0] & { id: string };
  productCategory: string | null;
  productType: string | null;
  productPlatform: string | null;
  disabled: boolean;
}) {
  if (!canShowDealConstructor(deal)) return null;
  const ready = isDealCompositionReady({ productCategory, productType, productPlatform });
  if (!ready || !productType) {
    return (
      <DealCompositionCard
        typeLabel=""
        platformLabel={null}
        coreTitle={null}
        extraCount={0}
        saleTotal={null}
        unitsTotal={undefined}
        canSeeUnits={false}
        ready={false}
        onOpen={() => undefined}
      />
    );
  }
  return (
    <ReadyDealComposition
      dealId={deal.id}
      productType={productType}
      productPlatform={productPlatform}
      disabled={disabled}
    />
  );
}

function ReadyDealComposition({
  dealId,
  productType,
  productPlatform,
  disabled,
}: {
  dealId: string;
  productType: string;
  productPlatform: string | null;
  disabled: boolean;
}) {
  const t = useTranslations('crm');
  const model = useDealConstructor(dealId, productType);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const selectedIds = new Set(model.quote?.items.map((item) => item.functionId) ?? []);
  const extras = model.catalog.items.filter((item) => selectedIds.has(item.id));

  return (
    <>
      <DealCompositionCard
        typeLabel={translateProductTypeLabel(t, productType)}
        platformLabel={productPlatform ? translateProductPlatformLabel(t, productPlatform) : null}
        coreTitle={model.coreTitle}
        extraCount={extras.length}
        saleTotal={model.saleTotal}
        unitsTotal={model.unitsTotal}
        canSeeUnits={model.canSeeUnits}
        ready
        error={model.error}
        onOpen={() => setCompositionOpen(true)}
      />
      <ProductCompositionSheet
        open={compositionOpen}
        onOpenChange={setCompositionOpen}
        coreProfileVersionId={model.quote?.coreProfileVersionId ?? null}
        coreTitle={model.coreTitle}
        extras={extras}
        collections={model.collections}
        appliedCollectionId={model.quote?.appliedCollectionId ?? null}
        saleTotal={model.saleTotal}
        unitsTotal={model.unitsTotal}
        canSeeUnits={model.canSeeUnits}
        showSalePrice
        salePriceByFunctionId={model.catalog.salePriceByFunctionId}
        unitsByFunctionId={model.canSeeUnits ? model.catalog.unitsByFunctionId : undefined}
        disabled={disabled || model.saving}
        error={model.error}
        canAdd
        onAdd={() => setCatalogOpen(true)}
        onApplyCollection={(collectionId) => void model.applyCollection(collectionId)}
        onRemoveExtra={model.toggle}
      />
      <FunctionCatalogSheet
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        items={model.catalog.items}
        loading={model.catalog.loading}
        error={model.catalog.error}
        onRetry={() => void model.catalog.reload()}
        unitsByFunctionId={model.canSeeUnits ? model.catalog.unitsByFunctionId : undefined}
        salePriceByFunctionId={model.catalog.salePriceByFunctionId}
        mode={dealCatalogPickerMode(model, selectedIds, disabled)}
      />
    </>
  );
}

function dealCatalogPickerMode(
  model: ReturnType<typeof useDealConstructor>,
  selectedIds: Set<string>,
  disabled: boolean,
) {
  return {
    kind: 'pick' as const,
    selectedIds,
    alreadyAddedIds: new Set<string>(),
    onToggle: disabled ? () => undefined : model.toggle,
    gradationByFunctionId: Object.fromEntries(
      (model.quote?.items ?? [])
        .filter((item) => item.tierId)
        .map((item) => [item.functionId, item.tierId as string]),
    ),
    onSelectGradation: disabled ? () => undefined : model.selectGradation,
  };
}
