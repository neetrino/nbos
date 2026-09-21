'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseFunctionPriceWriteBody, type DeliveryFunctionOperationalDto } from '@nbos/shared';
import { FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { Button } from '@/components/ui/button';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { DeliveryNormsFormBlock } from './delivery-norms-form-block';
import { dateInputToIso, isValidDateInput, todayDateInputValue } from './effective-from';
import { messageFromCaught } from './message-from-caught';
import { RoleUnitsEditor } from './role-units-editor';
import {
  buildCompleteRoleUnitVector,
  createEmptyRoleUnitDrafts,
  type RoleUnitDraftRow,
} from './role-units-draft';
import { selectOptionsFromRecord } from './select-options-from-record';

export function FunctionPriceCreateForm({
  catalog,
  disabled,
  onCreated,
  onError,
}: {
  catalog: DeliveryFunctionOperationalDto[];
  disabled?: boolean;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [functionId, setFunctionId] = useState<string>(OPTIONAL_SELECT_NONE);
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue);
  const [roleUnits, setRoleUnits] = useState<RoleUnitDraftRow[]>(createEmptyRoleUnitDrafts);
  const [saving, setSaving] = useState(false);
  const locked = Boolean(disabled || saving);

  return (
    <DeliveryNormsFormBlock title={t('prices.createTitle')}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitFunctionPrice({
            functionId,
            effectiveFrom,
            roleUnits,
            fallback: t('errors.create'),
            invalidDate: t('errors.effectiveFrom'),
            invalidUnits: t('errors.roleUnits'),
            missingFunction: t('errors.functionRequired'),
            onError,
            onCreated: () => {
              setFunctionId(OPTIONAL_SELECT_NONE);
              setRoleUnits(createEmptyRoleUnitDrafts());
              onCreated();
            },
            setSaving,
          });
        }}
      >
        <FunctionPriceDraftFields
          catalog={catalog}
          functionId={functionId}
          effectiveFrom={effectiveFrom}
          roleUnits={roleUnits}
          locked={locked}
          saving={saving}
          onFunctionIdChange={setFunctionId}
          onEffectiveFromChange={setEffectiveFrom}
          onRoleUnitsChange={setRoleUnits}
        />
      </form>
    </DeliveryNormsFormBlock>
  );
}

function FunctionPriceDraftFields({
  catalog,
  functionId,
  effectiveFrom,
  roleUnits,
  locked,
  saving,
  onFunctionIdChange,
  onEffectiveFromChange,
  onRoleUnitsChange,
}: {
  catalog: DeliveryFunctionOperationalDto[];
  functionId: string;
  effectiveFrom: string;
  roleUnits: RoleUnitDraftRow[];
  locked: boolean;
  saving: boolean;
  onFunctionIdChange: (value: string) => void;
  onEffectiveFromChange: (value: string) => void;
  onRoleUnitsChange: (value: RoleUnitDraftRow[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const labels: Record<string, string> = Object.fromEntries([
    [OPTIONAL_SELECT_NONE, t('none')],
    ...catalog.map((item) => [item.id, item.title]),
  ]);
  return (
    <>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          type="select"
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.function')}
          value={functionId}
          disabled={locked}
          options={selectOptionsFromRecord(
            [OPTIONAL_SELECT_NONE, ...catalog.map((item) => item.id)],
            labels,
          )}
          onValueChange={onFunctionIdChange}
        />
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
      <RoleUnitsEditor rows={roleUnits} disabled={locked} onChange={onRoleUnitsChange} />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={locked}>
          {saving ? t('create.creating') : t('create.price')}
        </Button>
      </div>
    </>
  );
}

async function submitFunctionPrice(input: {
  functionId: string;
  effectiveFrom: string;
  roleUnits: RoleUnitDraftRow[];
  fallback: string;
  invalidDate: string;
  invalidUnits: string;
  missingFunction: string;
  onError: (message: string) => void;
  onCreated: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  if (input.functionId === OPTIONAL_SELECT_NONE) {
    input.onError(input.missingFunction);
    return;
  }
  if (!isValidDateInput(input.effectiveFrom)) {
    input.onError(input.invalidDate);
    return;
  }
  const roleUnits = buildCompleteRoleUnitVector(input.roleUnits);
  if (roleUnits === null) {
    input.onError(input.invalidUnits);
    return;
  }
  input.setSaving(true);
  try {
    const body = parseFunctionPriceWriteBody({
      functionId: input.functionId,
      effectiveFrom: dateInputToIso(input.effectiveFrom),
      roleUnits,
    });
    await deliveryNormsApi.createFunctionPrice(body);
    input.onCreated();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
