'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseFunctionPriceWriteBody, type DeliveryFunctionOperationalDto } from '@nbos/shared';
import { InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { DeliveryNormsCreateSheet } from './delivery-norms-create-sheet';
import { DeliveryNormsSearchSelect } from './delivery-norms-search-select';
import { catalogFunctionOption } from './included-function-selection';
import { dateInputToIso, isValidDateInput, todayDateInputValue } from './effective-from';
import {
  defaultFunctionPriceTierId,
  functionPriceTierOptions,
  resolvedFunctionPriceTierId,
  selectedCatalogFunction,
} from './function-price-draft';
import { messageFromCaught } from './message-from-caught';
import { NormsSheetSection } from './norms-sheet-section';
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
  const [tierId, setTierId] = useState(OPTIONAL_SELECT_NONE);
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue);
  const [roleUnits, setRoleUnits] = useState<RoleUnitDraftRow[]>(createEmptyRoleUnitDrafts);
  const [saving, setSaving] = useState(false);
  const options = useMemo(() => catalog.map(catalogFunctionOption), [catalog]);
  const selected = selectedCatalogFunction(catalog, functionId);
  const tierOptions = functionPriceTierOptions(selected);

  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFunctionId(OPTIONAL_SELECT_NONE);
          setTierId(OPTIONAL_SELECT_NONE);
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
          catalog,
          functionId,
          tierId,
          effectiveFrom,
          roleUnits,
          fallback: t('errors.create'),
          invalidDate: t('errors.effectiveFrom'),
          invalidUnits: t('errors.roleUnits'),
          missingFunction: t('errors.functionRequired'),
          missingTier: t('errors.tierRequired'),
          onError,
          onCreated: () => {
            onCreated();
            onOpenChange(false);
          },
          setSaving,
        });
      }}
    >
      <>
        <NormsSheetSection title={t('sheet.tabs.general')}>
          <DeliveryNormsSearchSelect
            label={t('fields.function')}
            value={functionId === OPTIONAL_SELECT_NONE ? null : functionId}
            placeholder={t('prices.pickFunction')}
            disabled={saving}
            options={options}
            onChange={(value) => {
              const next = value ?? OPTIONAL_SELECT_NONE;
              setFunctionId(next);
              setTierId(defaultFunctionPriceTierId(selectedCatalogFunction(catalog, next)));
            }}
          />
          {tierOptions.length > 0 ? (
            <InlineField
              variant="controlled"
              type="select"
              className={FORM_FIELD_CELL_CLASS}
              label={t('fields.tier')}
              value={tierId === OPTIONAL_SELECT_NONE ? '' : tierId}
              options={tierOptions}
              placeholder={t('prices.pickTier')}
              disabled={saving}
              onValueChange={(value) => setTierId(value || OPTIONAL_SELECT_NONE)}
            />
          ) : null}
          <InlineField
            variant="controlled"
            type="date"
            className={FORM_FIELD_CELL_CLASS}
            label={t('fields.effectiveFrom')}
            value={effectiveFrom}
            disabled={saving}
            onValueChange={setEffectiveFrom}
          />
        </NormsSheetSection>
        <RoleUnitsEditor rows={roleUnits} disabled={saving} onChange={setRoleUnits} />
      </>
    </DeliveryNormsCreateSheet>
  );
}

async function submitFunctionPrice(input: {
  catalog: readonly DeliveryFunctionOperationalDto[];
  functionId: string;
  tierId: string;
  effectiveFrom: string;
  roleUnits: RoleUnitDraftRow[];
  fallback: string;
  invalidDate: string;
  invalidUnits: string;
  missingFunction: string;
  missingTier: string;
  onError: (message: string) => void;
  onCreated: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  const selected = selectedCatalogFunction(input.catalog, input.functionId);
  const resolvedTier = resolvedFunctionPriceTierId(selected, input.tierId);
  if (!selected) {
    input.onError(input.missingFunction);
    return;
  }
  if (!resolvedTier.ok) {
    input.onError(input.missingTier);
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
      tierId: resolvedTier.tierId,
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
