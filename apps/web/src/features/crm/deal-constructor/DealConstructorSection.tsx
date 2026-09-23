'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { FunctionCatalogSheet } from '@/features/function-catalog/function-catalog-sheet';
import { formatMoneyDram } from '@/lib/format/money';
import { translateProductPlatformLabel, translateProductTypeLabel } from '../i18n/crm-copy';
import {
  buildDealTaxonomyPatch,
  type DealGeneralDraft,
} from '../components/deal-general-form-state';
import { toCodeProductTypeOptions } from '../components/code-product-type-picker/code-product-type-options';
import { canShowDealConstructor, isDealCompositionReady } from './can-show-deal-constructor';
import type { CompositionProductTypeChange } from './composition-core-type-menu';
import { DealCompositionCard } from './deal-composition-card';
import { ProductCompositionSheet } from './product-composition-sheet';
import { splitDealFunctions } from './split-deal-composition';
import { useDealConstructor } from './use-deal-constructor';

type DealConstructorSectionProps = {
  deal: Parameters<typeof canShowDealConstructor>[0] & {
    id: string;
    productType: string | null;
    productCategory: string | null;
  };
  productCategory: string | null;
  productType: string | null;
  productPlatform: string | null;
  productTypeOptions: Array<{ value: string; label: string }>;
  onProductTypeChange: (patch: Partial<DealGeneralDraft>) => void;
  disabled: boolean;
};

export function DealConstructorSection({
  deal,
  productCategory,
  productType,
  productPlatform,
  productTypeOptions,
  onProductTypeChange,
  disabled,
}: DealConstructorSectionProps) {
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
      typeLocked={disabled}
      needsSave={selectionDiffers(deal, productType, productCategory)}
      productTypeOptions={productTypeOptions}
      onProductTypeChange={onProductTypeChange}
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

type ReadyCompositionProps = {
  dealId: string;
  productType: string;
  productCategory: string | null;
  productPlatform: string | null;
  productTypeOptions: Array<{ value: string; label: string }>;
  onProductTypeChange: (patch: Partial<DealGeneralDraft>) => void;
  disabled: boolean;
  typeLocked: boolean;
  needsSave: boolean;
};

function ReadyDealComposition(props: ReadyCompositionProps) {
  const t = useTranslations('crm');
  const model = useDealConstructor(props.dealId, props.productType, props.productCategory);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const selectedIds = new Set(model.quote?.items.map((item) => item.functionId) ?? []);
  const parts = splitDealFunctions(model.catalog.items, selectedIds, model.includedFunctionIds);
  return (
    <>
      <DealCompositionCard
        typeLabel={translateProductTypeLabel(t, props.productType)}
        platformLabel={
          props.productPlatform ? translateProductPlatformLabel(t, props.productPlatform) : null
        }
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
        disabled={props.disabled}
        needsSave={props.needsSave}
        coreName={translateProductTypeLabel(t, props.productType)}
        typeChange={compositionTypeChange(t, props)}
      />
    </>
  );
}

function compositionTypeChange(
  t: ReturnType<typeof useTranslations<'crm'>>,
  input: ReadyCompositionProps,
): CompositionProductTypeChange {
  return {
    value: input.productType,
    options: toCodeProductTypeOptions(t, input.productTypeOptions),
    disabled: input.typeLocked,
    onChange: (next) =>
      input.onProductTypeChange(
        buildDealTaxonomyPatch(input.productCategory, next || null, input.productPlatform),
      ),
  };
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
  coreName: string;
  typeChange: CompositionProductTypeChange;
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
        coreTitle={props.coreName}
        included={parts.base.map((item) => ({
          id: item.id,
          title: item.title,
          iconKey: item.iconKey,
        }))}
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
        productType={props.typeChange}
        coreVolumeFactor={model.quote?.coreVolumeFactor ?? '1.0'}
        volumeByFunctionId={volumeByFunction(model.quote?.items ?? [])}
        onCoreVolume={busy ? undefined : model.setCoreVolume}
        onFunctionVolume={busy ? undefined : model.setFunctionVolume}
        onExtrasVolume={busy ? undefined : model.setExtrasVolume}
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

function volumeByFunction(
  items: ReadonlyArray<{ functionId: string; volumeFactor: string }>,
): Map<string, string> {
  return new Map(items.map((item) => [item.functionId, item.volumeFactor]));
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
