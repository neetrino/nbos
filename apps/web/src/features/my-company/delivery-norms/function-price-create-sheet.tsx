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
  resolveFunctionPriceWriteTarget,
  selectedCatalogFunction,
} from './function-price-draft';
import type { LiveFunctionPrice } from './live-function-prices';
import { messageFromCaught } from './message-from-caught';
import { NormsSheetSection } from './norms-sheet-section';
import { RoleUnitsEditor } from './role-units-editor';
import {
  buildCompleteRoleUnitVector,
  createEmptyRoleUnitDrafts,
  roleUnitDraftsFromDto,
  type RoleUnitDraftRow,
} from './role-units-draft';

type FunctionPriceCreateSheetProps = {
  open: boolean;
  catalog: DeliveryFunctionOperationalDto[];
  editing?: LiveFunctionPrice | null;
  editingTitle?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onError: (message: string) => void;
};

export function FunctionPriceCreateSheet({
  open,
  catalog,
  editing = null,
  editingTitle,
  onOpenChange,
  onCreated,
  onError,
}: FunctionPriceCreateSheetProps) {
  return (
    <FunctionPriceSheetBody
      key={editing?.key ?? 'create'}
      open={open}
      catalog={catalog}
      editing={editing}
      editingTitle={editingTitle}
      onOpenChange={onOpenChange}
      onCreated={onCreated}
      onError={onError}
    />
  );
}

function FunctionPriceSheetBody({
  open,
  catalog,
  editing,
  editingTitle,
  onOpenChange,
  onCreated,
  onError,
}: FunctionPriceCreateSheetProps) {
  const t = useTranslations('hr.deliveryNorms');
  const form = useFunctionPriceForm(catalog, editing ?? null);
  const locked = Boolean(editing);
  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
      title={locked ? t('prices.editTitle') : t('prices.createTitle')}
      description={locked ? t('prices.editHint') : t('prices.createHint')}
      dirty
      saving={form.saving}
      saveLabel={form.saving ? t('create.creating') : locked ? t('edit.save') : t('create.price')}
      onSave={() => {
        void submitFunctionPrice({
          catalog,
          form,
          editing: editing ?? null,
          fallback: t('errors.create'),
          invalidUnits: t('errors.roleUnits'),
          missingFunction: t('errors.functionRequired'),
          missingTier: t('errors.tierRequired'),
          onError,
          onCreated: () => {
            onCreated();
            onOpenChange(false);
          },
        });
      }}
    >
      <FunctionPriceCreateFields
        catalog={catalog}
        form={form}
        locked={locked}
        lockedTitle={editingTitle}
      />
    </DeliveryNormsCreateSheet>
  );
}

function useFunctionPriceForm(
  catalog: DeliveryFunctionOperationalDto[],
  editing: LiveFunctionPrice | null,
) {
  const current = editing ? (editing.draft ?? editing.published) : null;
  const [functionId, setFunctionId] = useState(editing?.functionId ?? OPTIONAL_SELECT_NONE);
  const [tierId, setTierId] = useState(editing?.tierId ?? OPTIONAL_SELECT_NONE);
  const [roleUnits, setRoleUnits] = useState<RoleUnitDraftRow[]>(
    current ? roleUnitDraftsFromDto(current.roleUnits) : createEmptyRoleUnitDrafts(),
  );
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

type FunctionPriceForm = ReturnType<typeof useFunctionPriceForm>;

function FunctionPriceCreateFields({
  catalog,
  form,
  locked,
  lockedTitle,
}: {
  catalog: DeliveryFunctionOperationalDto[];
  form: FunctionPriceForm;
  locked: boolean;
  lockedTitle?: string;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <>
      <NormsSheetSection title={t('sheet.tabs.general')}>
        {locked ? (
          <p className="text-foreground text-sm font-medium">
            {lockedTitle ?? t('prices.unknownFunction')}
          </p>
        ) : (
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
        )}
        {!locked && form.tierOptions.length > 0 ? (
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
  form: FunctionPriceForm;
  editing: LiveFunctionPrice | null;
  fallback: string;
  invalidUnits: string;
  missingFunction: string;
  missingTier: string;
  onError: (message: string) => void;
  onCreated: () => void;
}): Promise<void> {
  const roleUnits = buildCompleteRoleUnitVector(input.form.roleUnits);
  if (roleUnits === null) {
    input.onError(input.invalidUnits);
    return;
  }
  const target = resolveFunctionPriceWriteTarget({
    catalog: input.catalog,
    functionId: input.form.functionId,
    tierId: input.form.tierId,
    locked: input.editing,
  });
  if (!target.ok) {
    input.onError(target.error === 'function' ? input.missingFunction : input.missingTier);
    return;
  }
  input.form.setSaving(true);
  try {
    if (input.editing?.draft) {
      await deliveryNormsApi.updateFunctionPriceDraft(input.editing.draft.id, { roleUnits });
    } else {
      await deliveryNormsApi.createFunctionPrice(
        parseFunctionPriceWriteBody({
          functionId: target.functionId,
          tierId: target.tierId,
          effectiveFrom: dateInputToIso(todayDateInputValue()),
          roleUnits,
        }),
      );
    }
    input.onCreated();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.form.setSaving(false);
  }
}
