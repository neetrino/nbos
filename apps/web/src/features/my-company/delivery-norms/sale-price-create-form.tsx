'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
import { AmdCurrencyIcon, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { Button } from '@/components/ui/button';
import {
  deliveryCatalogStructureApi,
  type SalePriceDraftInput,
} from '@/lib/api/delivery-catalog-structure';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { DeliveryNormsFormBlock } from './delivery-norms-form-block';
import { todayDateInputValue } from './effective-from';
import { messageFromCaught } from './message-from-caught';
import { buildSalePriceFormInput, type SalePriceTargetKind } from './sale-price-draft';

export function SalePriceCreateForm({
  kind,
  targetId,
  disabled,
  onCreated,
  onError,
}: {
  kind: SalePriceTargetKind;
  targetId: string;
  disabled?: boolean;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [multiplier, setMultiplier] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue);
  const [saving, setSaving] = useState(false);
  const locked = Boolean(disabled || saving);

  return (
    <DeliveryNormsFormBlock title={t('salePrices.createTitle')}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitSalePrice({
            kind,
            targetId,
            multiplier,
            fixedAmount,
            effectiveFrom,
            missingTarget: t('errors.targetRequired'),
            invalidDate: t('errors.effectiveFrom'),
            priceRequired: t('errors.salePriceRequired'),
            notPositive: t('errors.salePricePositive'),
            fallback: t('errors.salePrices'),
            onError,
            onCreated: () => {
              setMultiplier('');
              setFixedAmount('');
              onCreated();
            },
            setSaving,
          });
        }}
      >
        <SalePriceDraftFields
          multiplier={multiplier}
          fixedAmount={fixedAmount}
          effectiveFrom={effectiveFrom}
          locked={locked}
          saving={saving}
          onMultiplierChange={setMultiplier}
          onFixedAmountChange={setFixedAmount}
          onEffectiveFromChange={setEffectiveFrom}
        />
      </form>
    </DeliveryNormsFormBlock>
  );
}

function SalePriceDraftFields({
  multiplier,
  fixedAmount,
  effectiveFrom,
  locked,
  saving,
  onMultiplierChange,
  onFixedAmountChange,
  onEffectiveFromChange,
}: {
  multiplier: string;
  fixedAmount: string;
  effectiveFrom: string;
  locked: boolean;
  saving: boolean;
  onMultiplierChange: (value: string) => void;
  onFixedAmountChange: (value: string) => void;
  onEffectiveFromChange: (value: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={t('salePrices.multiplier')}
          value={multiplier}
          disabled={locked}
          onValueChange={onMultiplierChange}
        />
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={t('salePrices.fixedAmount', { currency: DELIVERY_COMPENSATION_CURRENCY })}
          value={fixedAmount}
          disabled={locked}
          icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
          onValueChange={onFixedAmountChange}
        />
      </FormFieldRow>
      <InlineField
        variant="controlled"
        type="date"
        label={t('fields.effectiveFrom')}
        value={effectiveFrom}
        disabled={locked}
        onValueChange={onEffectiveFromChange}
      />
      <p className="text-muted-foreground text-xs">{t('salePrices.fixedWins')}</p>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={locked}>
          {saving ? t('create.creating') : t('create.salePrice')}
        </Button>
      </div>
    </>
  );
}

async function submitSalePrice(input: {
  kind: SalePriceTargetKind;
  targetId: string;
  multiplier: string;
  fixedAmount: string;
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
    multiplier: input.multiplier,
    fixedAmount: input.fixedAmount,
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
  input: { multiplier?: string; fixedAmount?: string; effectiveFrom: string },
): SalePriceDraftInput {
  return {
    ...(kind === 'FUNCTION' ? { functionId: targetId } : {}),
    ...(kind === 'TIER' ? { tierId: targetId } : {}),
    ...(kind === 'CORE' ? { baseProfileVersionId: targetId } : {}),
    ...input,
  };
}
