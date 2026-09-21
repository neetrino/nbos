'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_COMPENSATION_CURRENCY,
  DELIVERY_COMPENSATION_ROLE_KEYS,
  parseRoleRateWriteBody,
  type DeliveryCompensationRoleKey,
} from '@nbos/shared';
import { AmdCurrencyIcon, InlineField } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { ROLE_MESSAGE_KEYS, SHEET_STACK_CLASS } from './delivery-norms.constants';
import { DeliveryNormsCreateSheet } from './delivery-norms-create-sheet';
import { dateInputToIso, isValidDateInput, todayDateInputValue } from './effective-from';
import { messageFromCaught } from './message-from-caught';
import {
  createEmptyRoleRateDrafts,
  fillRoleRatesAtSeed,
  type RoleRateDraftMap,
} from './role-units-draft';

export function RoleRateCreateSheet({
  open,
  onOpenChange,
  onCreated,
  onError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [rates, setRates] = useState<RoleRateDraftMap>(createEmptyRoleRateDrafts);
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue);
  const [saving, setSaving] = useState(false);

  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setRates(createEmptyRoleRateDrafts());
          setEffectiveFrom(todayDateInputValue());
        }
        onOpenChange(next);
      }}
      title={t('rates.createTitle')}
      description={t('rates.createHint')}
      dirty
      saving={saving}
      saveLabel={saving ? t('create.creating') : t('create.rate')}
      onSave={() => {
        void submitRoleRates({
          rates,
          effectiveFrom,
          fallback: t('errors.create'),
          invalidDate: t('errors.effectiveFrom'),
          emptyRates: t('errors.rateRequired'),
          onError,
          onCreated: () => {
            onCreated();
            onOpenChange(false);
          },
          setSaving,
        });
      }}
    >
      <div className={SHEET_STACK_CLASS}>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => setRates(fillRoleRatesAtSeed(rates))}
          >
            {t('rates.fillSeed')}
          </Button>
        </div>
        {DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => (
          <InlineField
            key={roleKey}
            variant="controlled"
            className={FORM_FIELD_CELL_CLASS}
            label={`${t(ROLE_MESSAGE_KEYS[roleKey])} · ${DELIVERY_COMPENSATION_CURRENCY}`}
            value={rates[roleKey]}
            disabled={saving}
            icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
            onValueChange={(value) => setRates({ ...rates, [roleKey]: value })}
          />
        ))}
        <InlineField
          variant="controlled"
          type="date"
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.effectiveFrom')}
          value={effectiveFrom}
          disabled={saving}
          onValueChange={setEffectiveFrom}
        />
      </div>
    </DeliveryNormsCreateSheet>
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
