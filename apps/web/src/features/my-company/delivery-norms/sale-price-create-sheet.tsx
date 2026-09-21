'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
import type { SearchOption } from '@/components/shared';
import { AmdCurrencyIcon, DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import {
  deliveryCatalogStructureApi,
  type SalePriceDraftInput,
} from '@/lib/api/delivery-catalog-structure';
import {
  OPTIONAL_SELECT_NONE,
  SALE_PRICE_TARGET_KINDS,
  type SalePriceTargetKind,
} from './delivery-norms.constants';
import { DeliveryNormsCreateSheet } from './delivery-norms-create-sheet';
import { DeliveryNormsSearchSelect } from './delivery-norms-search-select';
import { todayDateInputValue } from './effective-from';
import { messageFromCaught } from './message-from-caught';
import { NormsSheetSection } from './norms-sheet-section';
import { buildSalePriceFormInput } from './sale-price-draft';
import { selectOptionsFromRecord } from './select-options-from-record';

export function SalePriceCreateSheet({
  open,
  kind,
  targetId,
  targetOptions,
  kindLabels,
  onOpenChange,
  onKindChange,
  onTargetIdChange,
  onCreated,
  onError,
}: {
  open: boolean;
  kind: SalePriceTargetKind;
  targetId: string;
  targetOptions: readonly SearchOption[];
  kindLabels: Record<SalePriceTargetKind, string>;
  onOpenChange: (open: boolean) => void;
  onKindChange: (kind: SalePriceTargetKind) => void;
  onTargetIdChange: (id: string) => void;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [amountPerUnit, setAmountPerUnit] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue);
  const [saving, setSaving] = useState(false);

  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setAmountPerUnit('');
          setEffectiveFrom(todayDateInputValue());
        }
        onOpenChange(next);
      }}
      title={t('salePrices.createTitle')}
      description={t('salePrices.createHint')}
      dirty
      saving={saving}
      saveLabel={saving ? t('create.creating') : t('create.salePrice')}
      onSave={() => {
        void submitSalePrice({
          kind,
          targetId,
          amountPerUnit,
          effectiveFrom,
          missingTarget: t('errors.targetRequired'),
          invalidDate: t('errors.effectiveFrom'),
          priceRequired: t('errors.salePriceRequired'),
          notPositive: t('errors.salePricePositive'),
          fallback: t('errors.salePrices'),
          onError,
          onCreated: () => {
            onCreated();
            onOpenChange(false);
          },
          setSaving,
        });
      }}
    >
      <NormsSheetSection title={t('salePrices.title')}>
        <DetailSheetFieldSegmented
          className={FORM_FIELD_CELL_CLASS}
          label={t('salePrices.targetKind')}
          value={kind}
          options={selectOptionsFromRecord(SALE_PRICE_TARGET_KINDS, kindLabels)}
          onValueChange={onKindChange}
        />
        <DeliveryNormsSearchSelect
          label={t('salePrices.pickTarget')}
          value={targetId === OPTIONAL_SELECT_NONE ? null : targetId}
          placeholder={t('salePrices.pickTarget')}
          disabled={saving}
          options={targetOptions}
          onChange={(value) => onTargetIdChange(value ?? OPTIONAL_SELECT_NONE)}
        />
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={t('salePrices.amountPerUnit', { currency: DELIVERY_COMPENSATION_CURRENCY })}
          value={amountPerUnit}
          disabled={saving}
          icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
          onValueChange={setAmountPerUnit}
        />
        <InlineField
          variant="controlled"
          type="date"
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.effectiveFrom')}
          value={effectiveFrom}
          disabled={saving}
          onValueChange={setEffectiveFrom}
        />
        <p className="text-muted-foreground text-xs">{t('salePrices.targetHint')}</p>
      </NormsSheetSection>
    </DeliveryNormsCreateSheet>
  );
}

async function submitSalePrice(input: {
  kind: SalePriceTargetKind;
  targetId: string;
  amountPerUnit: string;
  effectiveFrom: string;
  missingTarget: string;
  invalidDate: string;
  priceRequired: string;
  notPositive: string;
  fallback: string;
  onError: (message: string) => void;
  onCreated: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  if (input.targetId === OPTIONAL_SELECT_NONE) {
    input.onError(input.missingTarget);
    return;
  }
  const parsed = buildSalePriceFormInput({
    amountPerUnit: input.amountPerUnit,
    effectiveFrom: input.effectiveFrom,
  });
  if (!parsed.ok) {
    input.onError(salePriceFormError(parsed.error, input));
    return;
  }
  input.setSaving(true);
  try {
    await deliveryCatalogStructureApi.createSalePriceDraft(
      salePriceDraftBody(input.kind, input.targetId, parsed.input),
    );
    input.onCreated();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}

function salePriceFormError(
  error: 'effectiveFrom' | 'priceRequired' | 'notPositive',
  messages: { invalidDate: string; priceRequired: string; notPositive: string },
): string {
  if (error === 'effectiveFrom') {
    return messages.invalidDate;
  }
  if (error === 'priceRequired') {
    return messages.priceRequired;
  }
  return messages.notPositive;
}

function salePriceDraftBody(
  kind: SalePriceTargetKind,
  targetId: string,
  input: { amountPerUnit: string; effectiveFrom: string },
): SalePriceDraftInput {
  return {
    ...(kind === 'FUNCTION' ? { functionId: targetId } : {}),
    ...(kind === 'TIER' ? { tierId: targetId } : {}),
    ...(kind === 'CORE' ? { baseProfileVersionId: targetId } : {}),
    ...input,
  };
}
