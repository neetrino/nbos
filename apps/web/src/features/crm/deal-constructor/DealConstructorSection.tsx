'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { FunctionCatalogSheet } from '@/features/function-catalog/function-catalog-sheet';
import { formatMoneyDram } from '@/lib/format/money';
import { translateProductPlatformLabel, translateProductTypeLabel } from '../i18n/crm-copy';
import { canShowDealConstructor, isDealCompositionReady } from './can-show-deal-constructor';
import { DealCompositionCard } from './deal-composition-card';
import { ProductCompositionSheet } from './product-composition-sheet';
import { splitDealFunctions } from './split-deal-composition';
import { useDealConstructor } from './use-deal-constructor';

export function DealConstructorSection({
  deal,
  productCategory,
  productType,
  productPlatform,
  disabled,
}: {
  deal: Parameters<typeof canShowDealConstructor>[0] & {
    id: string;
    productType: string | null;
    productCategory: string | null;
  };
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
      productCategory={productCategory}
      productPlatform={productPlatform}
      disabled={disabled || selectionDiffers(deal, productType, productCategory)}
      needsSave={selectionDiffers(deal, productType, productCategory)}
    />
  );
}

function selectionDiffers(
  saved: { productType: string | null; productCategory: string | null },
  productType: string,
  productCategory: string | null,
): boolean {
  return saved.productType !== productType || saved.productCategory !== productCategory;
}

function ReadyDealComposition({
  dealId,
  productType,
  productCategory,
  productPlatform,
  disabled,
  needsSave,
}: {
  dealId: string;
  productType: string;
  productCategory: string | null;
  productPlatform: string | null;
  disabled: boolean;
  needsSave: boolean;
}) {
  const t = useTranslations('crm');
  const model = useDealConstructor(dealId, productType, productCategory);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const selectedIds = new Set(model.quote?.items.map((item) => item.functionId) ?? []);
  const parts = splitDealFunctions(model.catalog.items, selectedIds, model.includedFunctionIds);

  return (
    <>
      <DealCompositionCard
        typeLabel={translateProductTypeLabel(t, productType)}
        platformLabel={productPlatform ? translateProductPlatformLabel(t, productPlatform) : null}
        extraCount={parts.extras.length}
        saleTotal={model.saleTotal}
        unitsTotal={model.unitsTotal}
        canSeeUnits={model.canSeeUnits}
        ready
        error={model.error}
        onOpen={() => setCompositionOpen(true)}
      />
      <OpenedDealComposition
        model={model}
        parts={parts}
        selectedIds={selectedIds}
        compositionOpen={compositionOpen}
        catalogOpen={catalogOpen}
        setCompositionOpen={setCompositionOpen}
        setCatalogOpen={setCatalogOpen}
        disabled={disabled}
        needsSave={needsSave}
      />
    </>
  );
}

type OpenedCompositionProps = {
  model: ReturnType<typeof useDealConstructor>;
  parts: { base: DeliveryFunctionOperationalDto[]; extras: DeliveryFunctionOperationalDto[] };
  selectedIds: Set<string>;
  compositionOpen: boolean;
  catalogOpen: boolean;
  setCompositionOpen: (open: boolean) => void;
  setCatalogOpen: (open: boolean) => void;
  disabled: boolean;
  needsSave: boolean;
};

function OpenedDealComposition(props: OpenedCompositionProps) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const { model, parts, disabled } = props;
  const busy = disabled || model.saving;
  return (
    <>
      <ProductCompositionSheet
        open={props.compositionOpen}
        onOpenChange={props.setCompositionOpen}
        coreProfileVersionId={model.quote?.coreProfileVersionId ?? null}
        coreTitle={model.coreTitle}
        included={parts.base.map((item) => ({ id: item.id, title: item.title }))}
        extras={parts.extras}
        blockedHint={props.needsSave ? t('saveTypeBeforeEdit') : null}
        saleTotal={model.saleTotal}
        unitsTotal={model.unitsTotal}
        canSeeUnits={model.canSeeUnits}
        showSalePrice
        salePriceByFunctionId={model.extraSalePrices}
        unitsByFunctionId={model.canSeeUnits ? model.catalog.unitsByFunctionId : undefined}
        coreSalePriceLabel={coreSaleLabel(model.coreSalePrice?.amount)}
        saleMissing={model.saleMissing}
        disabled={busy}
        error={model.error}
        canAdd
        onAdd={() => props.setCatalogOpen(true)}
        onRemoveExtra={model.toggle}
        onClearExtras={model.clearExtras}
      />
      <FunctionCatalogSheet
        open={props.catalogOpen}
        onOpenChange={props.setCatalogOpen}
        items={model.catalog.items}
        loading={model.catalog.loading}
        error={model.catalog.error}
        onRetry={() => void model.catalog.reload()}
        unitsByFunctionId={model.canSeeUnits ? model.catalog.unitsByFunctionId : undefined}
        salePriceByFunctionId={model.catalog.salePriceByFunctionId}
        mode={dealCatalogPickerMode(model, props.selectedIds, model.includedFunctionIds, disabled)}
        collections={model.collections}
        appliedCollectionId={model.quote?.appliedCollectionId ?? null}
        onApplyCollection={(collectionId) => void model.applyCollection(collectionId)}
        collectionsDisabled={busy}
      />
    </>
  );
}

function coreSaleLabel(amount: string | undefined): string | undefined {
  return amount ? formatMoneyDram(Number(amount)) : undefined;
}

function dealCatalogPickerMode(
  model: ReturnType<typeof useDealConstructor>,
  selectedIds: Set<string>,
  includedFunctionIds: readonly string[],
  disabled: boolean,
) {
  return {
    kind: 'pick' as const,
    selectedIds,
    alreadyAddedIds: selectedIds,
    includedIds: new Set(includedFunctionIds),
    onToggle: disabled ? () => undefined : model.toggle,
    gradationByFunctionId: Object.fromEntries(
      (model.quote?.items ?? [])
        .filter((item) => item.tierId)
        .map((item) => [item.functionId, item.tierId as string]),
    ),
    onSelectGradation: disabled ? () => undefined : model.selectGradation,
  };
}
