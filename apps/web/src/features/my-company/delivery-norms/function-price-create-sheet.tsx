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
import { dateInputToIso, todayDateInputValue } from './effective-from';
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

type FunctionPriceCreateSheetProps = {
  open: boolean;
  catalog: DeliveryFunctionOperationalDto[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onError: (message: string) => void;
};

export function FunctionPriceCreateSheet({
  open,
  catalog,
  onOpenChange,
  onCreated,
  onError,
}: FunctionPriceCreateSheetProps) {
  const t = useTranslations('hr.deliveryNorms');
  const form = useFunctionPriceCreateForm(catalog);
  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
      title={t('prices.createTitle')}
      description={t('prices.createHint')}
      dirty
      saving={form.saving}
      saveLabel={form.saving ? t('create.creating') : t('create.price')}
      onSave={() => {
        void submitFunctionPrice({
          catalog,
          functionId: form.functionId,
          tierId: form.tierId,
          roleUnits: form.roleUnits,
          fallback: t('errors.create'),
          invalidUnits: t('errors.roleUnits'),
          missingFunction: t('errors.functionRequired'),
          missingTier: t('errors.tierRequired'),
          onError,
          onCreated: () => {
            onCreated();
            onOpenChange(false);
          },
          setSaving: form.setSaving,
        });
      }}
    >
      <FunctionPriceCreateFields catalog={catalog} form={form} />
    </DeliveryNormsCreateSheet>
  );
}

function useFunctionPriceCreateForm(catalog: DeliveryFunctionOperationalDto[]) {
  const [functionId, setFunctionId] = useState(OPTIONAL_SELECT_NONE);
  const [tierId, setTierId] = useState(OPTIONAL_SELECT_NONE);
  const [roleUnits, setRoleUnits] = useState<RoleUnitDraftRow[]>(createEmptyRoleUnitDrafts);
  const [saving, setSaving] = useState(false);
  const options = useMemo(() => catalog.map(catalogFunctionOption), [catalog]);
  const tierOptions = functionPriceTierOptions(selectedCatalogFunction(catalog, functionId));
  return {
    functionId,
    tierId,
    roleUnits,
    saving,
    options,
    tierOptions,
    setFunctionId,
    setTierId,
    setRoleUnits,
    setSaving,
    reset: () => {
      setFunctionId(OPTIONAL_SELECT_NONE);
      setTierId(OPTIONAL_SELECT_NONE);
      setRoleUnits(createEmptyRoleUnitDrafts());
    },
  };
}

type FunctionPriceCreateForm = ReturnType<typeof useFunctionPriceCreateForm>;

function FunctionPriceCreateFields({
  catalog,
  form,
}: {
  catalog: DeliveryFunctionOperationalDto[];
  form: FunctionPriceCreateForm;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <>
      <NormsSheetSection title={t('sheet.tabs.general')}>
        <DeliveryNormsSearchSelect
          label={t('fields.function')}
          value={form.functionId === OPTIONAL_SELECT_NONE ? null : form.functionId}
          placeholder={t('prices.pickFunction')}
          disabled={form.saving}
          options={form.options}
          onChange={(value) => {
            const next = value ?? OPTIONAL_SELECT_NONE;
            form.setFunctionId(next);
            form.setTierId(defaultFunctionPriceTierId(selectedCatalogFunction(catalog, next)));
          }}
        />
        {form.tierOptions.length > 0 ? (
          <InlineField
            variant="controlled"
            type="select"
            className={FORM_FIELD_CELL_CLASS}
            label={t('fields.tier')}
            value={form.tierId === OPTIONAL_SELECT_NONE ? '' : form.tierId}
            options={form.tierOptions}
            placeholder={t('prices.pickTier')}
            disabled={form.saving}
            onValueChange={(value) => form.setTierId(value || OPTIONAL_SELECT_NONE)}
          />
        ) : null}
      </NormsSheetSection>
      <RoleUnitsEditor rows={form.roleUnits} disabled={form.saving} onChange={form.setRoleUnits} />
    </>
  );
}

async function submitFunctionPrice(input: {
  catalog: readonly DeliveryFunctionOperationalDto[];
  functionId: string;
  tierId: string;
  roleUnits: RoleUnitDraftRow[];
  fallback: string;
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
      effectiveFrom: dateInputToIso(todayDateInputValue()),
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
