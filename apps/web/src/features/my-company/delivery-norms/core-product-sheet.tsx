'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Layers, ListTree, Package, Puzzle, Tag } from 'lucide-react';
import type { DeliveryBaseProfileFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import { DetailSheetTabPanel, type DetailSheetTabItem } from '@/components/shared';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { saveCoreUnit } from './core-unit-persist';
import { liveCoreSource, useCoreProductDrafts } from './core-product-sheet-drafts';
import {
  CoreCollectionsTab,
  CoreCompositionTab,
  CoreIncludedTab,
  CoreUnitsTab,
} from './core-product-sheet-tabs';
import type { DeliveryNormsCoreSheetTab } from './delivery-norms-workspace';
import { liveNormDisplayStatus, type LiveNormPair } from './live-norm-pair';
import { liveSalePrices } from './live-sale-prices';
import { NormsEntitySheet } from './norms-entity-sheet';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { targetKeyForKind } from './sale-price-draft';
import { saveSalePriceDraft } from './sale-price-save';
import { SalePriceSheetEditor, useSalePriceAmount } from './sale-price-sheet-editor';

export function CoreProductSheet({
  open,
  productType,
  title,
  pair,
  catalog,
  salePrices,
  canSave,
  canPublish,
  onOpenChange,
  onChanged,
  onError,
}: {
  open: boolean;
  productType: string;
  title: string;
  pair: LiveNormPair<DeliveryBaseProfileFinancialDto> | null;
  catalog: DeliveryFunctionOperationalDto[];
  salePrices: SalePriceVersionDto[];
  canSave: boolean;
  canPublish: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const source = liveCoreSource(pair);
  const drafts = useCoreProductDrafts(source);
  const [tab, setTab] = useState<DeliveryNormsCoreSheetTab>('composition');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [seenKind, setSeenKind] = useState(productType);
  const salePair = coreSalePair(source, salePrices);
  const price = useSalePriceAmount(salePair);
  const tabs = useCoreSheetTabs(t);
  if (productType !== seenKind) {
    setSeenKind(productType);
    setTab('composition');
    setErrorMessage(null);
  }

  const status = pair && (pair.published || pair.draft) ? liveNormDisplayStatus(pair) : null;

  return (
    <NormsEntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      icon={<Package className="size-5" aria-hidden />}
      badge={
        status ? (
          <NormativeStatusBadge status={status} label={t(normativeStatusLabelKey(status))} />
        ) : null
      }
      tabs={tabs}
      activeTab={tab}
      onTabChange={(value) => setTab(value as DeliveryNormsCoreSheetTab)}
      footer={coreSheetFooter({
        tab,
        drafts,
        priceDirty: price.dirty,
        saving,
        errorMessage,
        saveLabel: t('edit.save'),
        onCancel: () => {
          setErrorMessage(null);
          if (tab === 'units') drafts.resetUnits();
          if (tab === 'included') drafts.resetIncluded();
          if (tab === 'price') price.reset();
        },
        onSave: () => {
          void persistCoreSheet({
            tab,
            productType,
            draftId: pair?.draft?.id ?? null,
            drafts,
            salePair,
            amount: price.amount,
            canSave,
            t,
            setSaving,
            setErrorMessage,
            onChanged,
            onError,
          });
        },
      })}
    >
      <DetailSheetTabPanel tabKey={tab}>
        {tab === 'composition' ? (
          <CoreCompositionTab
            versionId={source?.id ?? null}
            status={source?.status ?? 'DRAFT'}
            roleUnits={source?.roleUnits ?? []}
            coreItems={source?.coreItems}
            canEdit={canPublish}
            onError={onError}
            onChanged={onChanged}
          />
        ) : null}
        {tab === 'units' ? (
          <CoreUnitsTab
            roleUnits={drafts.roleUnits}
            draftId={pair?.draft?.id ?? null}
            draftRoleUnits={pair?.draft?.roleUnits ?? null}
            canPublish={canPublish}
            disabled={saving || !canSave}
            onChange={drafts.setRoleUnits}
            onError={onError}
            onChanged={onChanged}
          />
        ) : null}
        {tab === 'included' ? (
          <CoreIncludedTab
            catalog={catalog}
            selectedIds={drafts.includedFunctionIds}
            disabled={saving || !canSave}
            onChange={drafts.setIncludedFunctionIds}
          />
        ) : null}
        {tab === 'price' ? (
          source ? (
            <SalePriceSheetEditor
              pair={salePair}
              hint={t('salePrices.createHint')}
              canPublish={canPublish}
              amount={price.amount}
              onAmountChange={price.setAmount}
              onChanged={onChanged}
              onError={onError}
            />
          ) : (
            <p className="text-muted-foreground text-sm">{t('sheet.needCore')}</p>
          )
        ) : null}
        {tab === 'collections' ? (
          <CoreCollectionsTab
            productType={productType}
            catalog={catalog}
            canEdit={canPublish}
            onError={onError}
          />
        ) : null}
      </DetailSheetTabPanel>
    </NormsEntitySheet>
  );
}

function useCoreSheetTabs(
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): DetailSheetTabItem[] {
  return useMemo(
    () => [
      { value: 'composition', label: t('sheet.tabs.composition'), icon: ListTree },
      { value: 'units', label: t('sheet.tabs.units'), icon: Layers },
      { value: 'included', label: t('sheet.tabs.included'), icon: Puzzle },
      { value: 'price', label: t('sheet.tabs.price'), icon: Tag },
      { value: 'collections', label: t('sheet.tabs.collections'), icon: Package },
    ],
    [t],
  );
}

function coreSalePair(
  source: DeliveryBaseProfileFinancialDto | null,
  salePrices: readonly SalePriceVersionDto[],
) {
  if (!source) return null;
  const key = targetKeyForKind('CORE', source.id);
  return liveSalePrices(salePrices, 'CORE', [key])[0] ?? null;
}

function coreSheetFooter(input: {
  tab: DeliveryNormsCoreSheetTab;
  drafts: ReturnType<typeof useCoreProductDrafts>;
  priceDirty: boolean;
  saving: boolean;
  errorMessage: string | null;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (input.tab !== 'units' && input.tab !== 'included' && input.tab !== 'price') {
    return undefined;
  }
  const dirty =
    input.tab === 'units'
      ? input.drafts.unitsDirty
      : input.tab === 'included'
        ? input.drafts.includedDirty
        : input.priceDirty;
  return {
    visible: true,
    dirty,
    saving: input.saving,
    errorMessage: input.errorMessage,
    saveLabel: input.saveLabel,
    onCancel: input.onCancel,
    onSave: input.onSave,
  };
}

async function persistCoreSheet(input: {
  tab: DeliveryNormsCoreSheetTab;
  productType: string;
  draftId: string | null;
  drafts: ReturnType<typeof useCoreProductDrafts>;
  salePair: ReturnType<typeof coreSalePair>;
  amount: string;
  canSave: boolean;
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>;
  setSaving: (value: boolean) => void;
  setErrorMessage: (value: string | null) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}): Promise<void> {
  input.setErrorMessage(null);
  input.setSaving(true);
  const fail = (message: string) => {
    input.setErrorMessage(message);
    input.onError(message);
  };
  try {
    if (input.tab === 'price') {
      if (!input.salePair || input.amount.trim() === '') return;
      await saveSalePriceDraft({
        pair: input.salePair,
        nextAmount: input.amount,
        fallback: input.t('errors.salePrices'),
        onError: fail,
        onChanged: input.onChanged,
      });
      return;
    }
    await saveCoreUnit({
      productType: input.productType,
      draftId: input.draftId,
      roleUnits: input.drafts.roleUnits,
      includedFunctionIds: input.drafts.includedFunctionIds,
      canSave: input.canSave,
      invalidUnits: input.t('errors.roleUnits'),
      fallback: input.t('errors.create'),
      onError: fail,
      onSaved: input.onChanged,
    });
  } finally {
    input.setSaving(false);
  }
}
