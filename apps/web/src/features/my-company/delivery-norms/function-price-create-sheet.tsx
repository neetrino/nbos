'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseFunctionPriceWriteBody, type DeliveryFunctionOperationalDto } from '@nbos/shared';
import { InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { DETAIL_SHEET_SUBSECTION_LABEL_CLASS } from '@/components/shared/detail-sheet-classes';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { OPTIONAL_SELECT_NONE, SHEET_STACK_CLASS } from './delivery-norms.constants';
import { DeliveryNormsCreateSheet } from './delivery-norms-create-sheet';
import { DeliveryNormsSearchSelect } from './delivery-norms-search-select';
import { catalogFunctionOption } from './included-function-selection';
import { dateInputToIso, isValidDateInput, todayDateInputValue } from './effective-from';
import { messageFromCaught } from './message-from-caught';
import { RoleUnitsEditor } from './role-units-editor';
import {
  buildCompleteRoleUnitVector,
  createEmptyRoleUnitDrafts,
  type RoleUnitDraftRow,
} from './role-units-draft';

export function FunctionPriceCreateSheet({
  open,
  catalog,
  onOpenChange,
  onCreated,
  onError,
}: {
  open: boolean;
  catalog: DeliveryFunctionOperationalDto[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [functionId, setFunctionId] = useState(OPTIONAL_SELECT_NONE);
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue);
  const [roleUnits, setRoleUnits] = useState<RoleUnitDraftRow[]>(createEmptyRoleUnitDrafts);
  const [saving, setSaving] = useState(false);
  const options = useMemo(() => catalog.map(catalogFunctionOption), [catalog]);

  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFunctionId(OPTIONAL_SELECT_NONE);
          setEffectiveFrom(todayDateInputValue());
          setRoleUnits(createEmptyRoleUnitDrafts());
        }
        onOpenChange(next);
      }}
      title={t('prices.createTitle')}
      description={t('prices.createHint')}
      dirty
      saving={saving}
      saveLabel={saving ? t('create.creating') : t('create.price')}
      onSave={() => {
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
            onCreated();
            onOpenChange(false);
          },
          setSaving,
        });
      }}
    >
      <div className={SHEET_STACK_CLASS}>
        <section className={SHEET_STACK_CLASS}>
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>{t('sheet.tabs.general')}</p>
          <div className={SHEET_STACK_CLASS}>
            <DeliveryNormsSearchSelect
              label={t('fields.function')}
              value={functionId === OPTIONAL_SELECT_NONE ? null : functionId}
              placeholder={t('prices.pickFunction')}
              disabled={saving}
              options={options}
              onChange={(value) => setFunctionId(value ?? OPTIONAL_SELECT_NONE)}
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
          </div>
        </section>
        <RoleUnitsEditor rows={roleUnits} disabled={saving} onChange={setRoleUnits} />
      </div>
    </DeliveryNormsCreateSheet>
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
