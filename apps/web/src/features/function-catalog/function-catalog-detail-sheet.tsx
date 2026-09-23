'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Layers, Tag } from 'lucide-react';
import type {
  DeliveryFunctionOperationalDto,
  DeliveryFunctionPriceFinancialDto,
} from '@nbos/shared';
import { DetailSheetTabPanel, type DetailSheetTabItem } from '@/components/shared';
import { FunctionVolumeSelect } from '@/features/my-company/delivery-norms/function-volume-select';
import type { DeliveryNormsFunctionSheetTab } from '@/features/my-company/delivery-norms/delivery-norms-workspace';
import { saveFunctionPrice } from '@/features/my-company/delivery-norms/function-price-save';
import {
  functionSalePair,
  useFunctionSheetDrafts,
} from '@/features/my-company/delivery-norms/function-sheet-drafts';
import { FunctionUnitsTab } from '@/features/my-company/delivery-norms/function-units-tab';
import { liveFunctionPrices } from '@/features/my-company/delivery-norms/live-function-prices';
import { NormsEntitySheet } from '@/features/my-company/delivery-norms/norms-entity-sheet';
import { PublishDraftButton } from '@/features/my-company/delivery-norms/publish-draft-button';
import { publishFunctionSheetDrafts } from '@/features/my-company/delivery-norms/publish-sheet-drafts';
import { saveSalePriceDraft } from '@/features/my-company/delivery-norms/sale-price-save';
import {
  SalePriceSheetEditor,
  useSalePriceAmount,
} from '@/features/my-company/delivery-norms/sale-price-sheet-editor';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { CatalogFunctionIcon } from './catalog-icon';
import { CATALOG_ICON_SIZE_PX } from './function-catalog.constants';
import { FunctionInstructionSheet } from './function-instruction-sheet';

export function FunctionCatalogDetailSheet({
  item,
  prices,
  salePrices,
  canSeeRules,
  canAdd,
  canPublish,
  onOpenChange,
  onChanged,
  onError,
}: {
  item: DeliveryFunctionOperationalDto | null;
  prices: DeliveryFunctionPriceFinancialDto[];
  salePrices: SalePriceVersionDto[];
  canSeeRules: boolean;
  canAdd: boolean;
  canPublish: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [tab, setTab] = useState<DeliveryNormsFunctionSheetTab>('general');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [seenId, setSeenId] = useState(item?.id ?? null);
  const pairs = useMemo(() => liveFunctionPrices(prices), [prices]);
  const drafts = useFunctionSheetDrafts(item, pairs);
  const salePair = item ? functionSalePair(item, drafts.tierId, salePrices) : null;
  const price = useSalePriceAmount(salePair);
  if ((item?.id ?? null) !== seenId) {
    setSeenId(item?.id ?? null);
    setTab('general');
    setErrorMessage(null);
  }

  const tabs = useFunctionSheetTabs(canSeeRules, t);
  const canWrite = drafts.selected?.draft ? canPublish : canAdd;

  return (
    <NormsEntitySheet
      open={item !== null}
      onOpenChange={onOpenChange}
      title={item?.title ?? ''}
      subtitle={item?.summary}
      icon={
        item ? <CatalogFunctionIcon iconKey={item.iconKey} size={CATALOG_ICON_SIZE_PX} /> : null
      }
      headerAction={
        canPublish && (drafts.selected?.draft || salePair?.draft) ? (
          <PublishDraftButton
            roleUnits={drafts.selected?.draft?.roleUnits ?? []}
            onPublish={async (confirmZeroUnits) => {
              await publishFunctionSheetDrafts({
                priceDraftId: drafts.selected?.draft?.id ?? null,
                saleDraftId: salePair?.draft?.id ?? null,
                confirmZeroUnits,
              });
            }}
            onError={onError}
            onPublished={onChanged}
          />
        ) : null
      }
      tabs={tabs}
      activeTab={tab}
      onTabChange={(value) => setTab(value as DeliveryNormsFunctionSheetTab)}
      footer={functionSheetFooter({
        tab,
        canSeeRules,
        unitsDirty: drafts.unitsDirty,
        priceDirty: price.dirty,
        saving,
        errorMessage,
        saveLabel: t('edit.save'),
        onCancel: () => {
          setErrorMessage(null);
          if (tab === 'units') drafts.resetUnits();
          else price.reset();
        },
        onSave: () => {
          if (!item) return;
          void persistFunctionSheet({
            tab,
            item,
            drafts,
            salePair,
            amount: price.amount,
            canWrite,
            t,
            setSaving,
            setErrorMessage,
            onChanged,
            onError,
          });
        },
      })}
    >
      {item ? (
        <FunctionSheetBody
          item={item}
          tab={tab}
          canSeeRules={canSeeRules}
          canPublish={canPublish}
          canWrite={canWrite}
          saving={saving}
          drafts={drafts}
          salePair={salePair}
          price={price}
        />
      ) : null}
    </NormsEntitySheet>
  );
}

function FunctionSheetBody({
  item,
  tab,
  canSeeRules,
  canPublish,
  canWrite,
  saving,
  drafts,
  salePair,
  price,
}: {
  item: DeliveryFunctionOperationalDto;
  tab: DeliveryNormsFunctionSheetTab;
  canSeeRules: boolean;
  canPublish: boolean;
  canWrite: boolean;
  saving: boolean;
  drafts: ReturnType<typeof useFunctionSheetDrafts>;
  salePair: ReturnType<typeof functionSalePair>;
  price: ReturnType<typeof useSalePriceAmount>;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <DetailSheetTabPanel tabKey={tab}>
      {tab === 'general' ? <FunctionInstructionSheet item={item} /> : null}
      {tab === 'units' && canSeeRules ? (
        <FunctionUnitsTab
          tierOptions={drafts.tierOptions}
          tierId={drafts.tierId}
          roleUnits={drafts.roleUnits}
          disabled={saving || !canWrite}
          onTierChange={drafts.selectTier}
          onRoleUnits={drafts.setRoleUnits}
        />
      ) : null}
      {tab === 'price' && canSeeRules ? (
        <SalePriceSheetEditor
          pair={salePair}
          hint={t('salePrices.createHint')}
          extra={
            drafts.tierOptions.length > 0 ? (
              <FunctionVolumeSelect
                options={drafts.tierOptions}
                value={drafts.tierId}
                disabled={saving}
                onChange={drafts.selectTier}
              />
            ) : null
          }
          canPublish={canPublish}
          amount={price.amount}
          onAmountChange={price.setAmount}
        />
      ) : null}
    </DetailSheetTabPanel>
  );
}

function useFunctionSheetTabs(
  canSeeRules: boolean,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): DetailSheetTabItem[] {
  return useMemo(() => {
    const items: DetailSheetTabItem[] = [
      { value: 'general', label: t('sheet.tabs.general'), icon: FileText },
    ];
    if (!canSeeRules) return items;
    items.push(
      { value: 'units', label: t('sheet.tabs.units'), icon: Layers },
      { value: 'price', label: t('sheet.tabs.price'), icon: Tag },
    );
    return items;
  }, [canSeeRules, t]);
}

function functionSheetFooter(input: {
  tab: DeliveryNormsFunctionSheetTab;
  canSeeRules: boolean;
  unitsDirty: boolean;
  priceDirty: boolean;
  saving: boolean;
  errorMessage: string | null;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!input.canSeeRules || (input.tab !== 'units' && input.tab !== 'price')) return undefined;
  return {
    visible: true,
    dirty: input.tab === 'units' ? input.unitsDirty : input.priceDirty,
    saving: input.saving,
    errorMessage: input.errorMessage,
    saveLabel: input.saveLabel,
    onCancel: input.onCancel,
    onSave: input.onSave,
  };
}

async function persistFunctionSheet(input: {
  tab: DeliveryNormsFunctionSheetTab;
  item: DeliveryFunctionOperationalDto;
  drafts: ReturnType<typeof useFunctionSheetDrafts>;
  salePair: ReturnType<typeof functionSalePair>;
  amount: string;
  canWrite: boolean;
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
    if (input.tab === 'units') {
      if (!input.canWrite) return;
      await saveFunctionPrice({
        catalog: [input.item],
        item: input.item,
        focusFunctionId: input.item.id,
        focused: input.drafts.focused,
        tierId: input.drafts.tierId,
        roleUnits: input.drafts.roleUnits,
        fallback: input.t('errors.create'),
        invalidUnits: input.t('errors.roleUnits'),
        missingFunction: input.t('errors.functionRequired'),
        missingTier: input.t('errors.tierRequired'),
        onError: fail,
        onSaved: input.onChanged,
      });
      return;
    }
    if (!input.salePair || input.amount.trim() === '') return;
    await saveSalePriceDraft({
      pair: input.salePair,
      nextAmount: input.amount,
      fallback: input.t('errors.salePrices'),
      onError: fail,
      onChanged: input.onChanged,
    });
  } finally {
    input.setSaving(false);
  }
}
