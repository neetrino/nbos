'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_COMPENSATION_CURRENCY,
  DELIVERY_COMPENSATION_ROLE_KEYS,
  parseRoleRateWriteBody,
  type DeliveryCompensationRoleKey,
} from '@nbos/shared';
import { AmdCurrencyIcon, FormFieldRow, InlineField } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FORM_FIELD_CELL_CLASS, FORM_FIELD_ROW_3_CLASS } from '@/components/shared/create-form';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { ROLE_MESSAGE_KEYS } from './delivery-norms.constants';
import { DeliveryNormsFormBlock } from './delivery-norms-form-block';
import { dateInputToIso, isValidDateInput, todayDateInputValue } from './effective-from';
import { messageFromCaught } from './message-from-caught';
import {
  createEmptyRoleRateDrafts,
  fillRoleRatesAtSeed,
  type RoleRateDraftMap,
} from './role-units-draft';

export function RoleRateCreateForm({
  disabled,
  onCreated,
  onError,
}: {
  disabled?: boolean;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [rates, setRates] = useState<RoleRateDraftMap>(createEmptyRoleRateDrafts);
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue);
  const [saving, setSaving] = useState(false);
  const filledRoles = useMemo(() => filledRoleKeys(rates), [rates]);
  const locked = Boolean(disabled || saving);

  return (
    <DeliveryNormsFormBlock title={t('rates.createTitle')}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitRoleRates({
            rates,
            effectiveFrom,
            fallback: t('errors.create'),
            invalidDate: t('errors.effectiveFrom'),
            emptyRates: t('errors.rateRequired'),
            onError,
            onCreated: () => {
              setRates(createEmptyRoleRateDrafts());
              onCreated();
            },
            setSaving,
          });
        }}
      >
        <RoleRateDraftFields
          rates={rates}
          effectiveFrom={effectiveFrom}
          locked={locked}
          canSubmit={filledRoles.length > 0}
          saving={saving}
          onRatesChange={setRates}
          onEffectiveFromChange={setEffectiveFrom}
        />
      </form>
    </DeliveryNormsFormBlock>
  );
}

function RoleRateDraftFields({
  rates,
  effectiveFrom,
  locked,
  canSubmit,
  saving,
  onRatesChange,
  onEffectiveFromChange,
}: {
  rates: RoleRateDraftMap;
  effectiveFrom: string;
  locked: boolean;
  canSubmit: boolean;
  saving: boolean;
  onRatesChange: (next: RoleRateDraftMap) => void;
  onEffectiveFromChange: (next: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={locked}
          onClick={() => onRatesChange(fillRoleRatesAtSeed(rates))}
        >
          {t('rates.fillSeed')}
        </Button>
      </div>
      <div className={FORM_FIELD_ROW_3_CLASS}>
        {DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => (
          <InlineField
            key={roleKey}
            variant="controlled"
            className={FORM_FIELD_CELL_CLASS}
            label={`${t(ROLE_MESSAGE_KEYS[roleKey])} · ${DELIVERY_COMPENSATION_CURRENCY}`}
            value={rates[roleKey]}
            disabled={locked}
            icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
            onValueChange={(value) => onRatesChange({ ...rates, [roleKey]: value })}
          />
        ))}
      </div>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          type="date"
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.effectiveFrom')}
          value={effectiveFrom}
          disabled={locked}
          onValueChange={onEffectiveFromChange}
        />
      </FormFieldRow>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={locked || !canSubmit}>
          {saving ? t('create.creating') : t('create.rate')}
        </Button>
      </div>
    </>
  );
}

function filledRoleKeys(rates: RoleRateDraftMap): DeliveryCompensationRoleKey[] {
  return DELIVERY_COMPENSATION_ROLE_KEYS.filter((roleKey) => rates[roleKey].trim() !== '');
}

async function submitRoleRates(input: {
  rates: RoleRateDraftMap;
  effectiveFrom: string;
  fallback: string;
  invalidDate: string;
  emptyRates: string;
  onError: (message: string) => void;
  onCreated: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  const roles = filledRoleKeys(input.rates);
  if (roles.length === 0) {
    input.onError(input.emptyRates);
    return;
  }
  if (!isValidDateInput(input.effectiveFrom)) {
    input.onError(input.invalidDate);
    return;
  }
  input.setSaving(true);
  try {
    await createFilledRoleRates(input.rates, roles, dateInputToIso(input.effectiveFrom));
    input.onCreated();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}

async function createFilledRoleRates(
  rates: RoleRateDraftMap,
  roles: DeliveryCompensationRoleKey[],
  effectiveFrom: string,
): Promise<void> {
  for (const roleKey of roles) {
    const body = parseRoleRateWriteBody({
      roleKey,
      rate: rates[roleKey].trim(),
      effectiveFrom,
      currency: DELIVERY_COMPENSATION_CURRENCY,
    });
    await deliveryNormsApi.createRoleRate(body);
  }
}
