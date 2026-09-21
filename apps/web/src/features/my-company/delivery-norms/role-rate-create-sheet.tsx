'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_COMPENSATION_CURRENCY,
  DELIVERY_COMPENSATION_ROLE_KEYS,
  parseRoleRateWriteBody,
  type DeliveryCompensationRoleKey,
  type DeliveryRoleRateFinancialDto,
} from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { currentRatesByRole } from './current-published-role-rate';
import { DeliveryNormsCreateSheet } from './delivery-norms-create-sheet';
import { dateInputToIso, isValidDateInput, todayDateInputValue } from './effective-from';
import { messageFromCaught } from './message-from-caught';
import { RoleRateDraftForm } from './role-rate-draft-form';
import { createEmptyRoleRateDrafts, type RoleRateDraftMap } from './role-units-draft';

export function RoleRateCreateSheet({
  open,
  rows,
  onOpenChange,
  onCreated,
  onError,
}: {
  open: boolean;
  rows: readonly DeliveryRoleRateFinancialDto[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const draft = useRoleRateDraft(rows, onOpenChange, onCreated, onError);
  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={draft.onSheetOpenChange}
      title={draft.title}
      description={draft.description}
      dirty
      saving={draft.saving}
      saveLabel={draft.saveLabel}
      onSave={draft.onSave}
    >
      <RoleRateDraftForm
        rates={draft.rates}
        currentByRole={draft.currentByRole}
        effectiveFrom={draft.effectiveFrom}
        saving={draft.saving}
        onRatesChange={draft.setRates}
        onEffectiveFromChange={draft.setEffectiveFrom}
      />
    </DeliveryNormsCreateSheet>
  );
}

function useRoleRateDraft(
  rows: readonly DeliveryRoleRateFinancialDto[],
  onOpenChange: (open: boolean) => void,
  onCreated: () => void,
  onError: (message: string) => void,
) {
  const t = useTranslations('hr.deliveryNorms');
  const [rates, setRates] = useState<RoleRateDraftMap>(createEmptyRoleRateDrafts);
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue);
  const [saving, setSaving] = useState(false);
  const currentByRole = useMemo(() => currentRatesByRole(rows), [rows]);
  return {
    rates,
    setRates,
    currentByRole,
    effectiveFrom,
    setEffectiveFrom,
    saving,
    title: t('rates.createTitle'),
    description: t('rates.createHint'),
    saveLabel: saving ? t('create.creating') : t('create.rate'),
    onSheetOpenChange: (next: boolean) => {
      if (!next) {
        setRates(createEmptyRoleRateDrafts());
        setEffectiveFrom(todayDateInputValue());
      }
      onOpenChange(next);
    },
    onSave: () => {
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
    },
  };
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
