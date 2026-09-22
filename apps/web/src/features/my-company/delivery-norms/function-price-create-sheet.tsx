'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseFunctionPriceWriteBody, type DeliveryFunctionOperationalDto } from '@nbos/shared';
import { InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { DeliveryNormsCreateSheet } from './delivery-norms-create-sheet';
import { dateInputToIso, todayDateInputValue } from './effective-from';
import { functionPriceTierOptions, resolveFunctionPriceWriteTarget } from './function-price-draft';
import { initialTierSelection, pairForSelection, pairsForFunction } from './function-unit-focus';
import type { LiveFunctionPrice } from './live-function-prices';
import { messageFromCaught } from './message-from-caught';
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
  focusFunctionId: string | null;
  focusTitle?: string;
  pairs: LiveFunctionPrice[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onError: (message: string) => void;
};

export function FunctionPriceCreateSheet(props: FunctionPriceCreateSheetProps) {
  if (!props.focusFunctionId) return null;
  return (
    <FunctionPriceSheetBody
      key={props.focusFunctionId}
      {...props}
      focusFunctionId={props.focusFunctionId}
    />
  );
}

function FunctionPriceSheetBody({
  open,
  catalog,
  focusFunctionId,
  focusTitle,
  pairs,
  onOpenChange,
  onCreated,
  onError,
}: FunctionPriceCreateSheetProps & { focusFunctionId: string }) {
  const t = useTranslations('hr.deliveryNorms');
  const item = catalog.find((entry) => entry.id === focusFunctionId);
  const focused = useMemo(() => pairsForFunction(pairs, focusFunctionId), [focusFunctionId, pairs]);
  const form = useFunctionPriceForm(item, focused);
  const selected = pairForSelection(item, focused, form.tierId);
  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={onOpenChange}
      title={focusTitle ?? t('prices.editTitle')}
      description={t('prices.editHint')}
      dirty
      saving={form.saving}
      saveLabel={
        form.saving ? t('create.creating') : selected?.draft ? t('edit.save') : t('create.price')
      }
      onSave={() => {
        void submitFunctionPrice({
          catalog,
          item,
          focusFunctionId,
          focused,
          form,
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
      <FunctionPriceFields form={form} />
    </DeliveryNormsCreateSheet>
  );
}

function useFunctionPriceForm(
  item: DeliveryFunctionOperationalDto | undefined,
  pairs: LiveFunctionPrice[],
) {
  const [tierId, setTierId] = useState(() => initialTierSelection(item, pairs));
  const [roleUnits, setRoleUnits] = useState<RoleUnitDraftRow[]>(() =>
    draftsForSelection(item, pairs, initialTierSelection(item, pairs)),
  );
  const [saving, setSaving] = useState(false);
  const tierOptions = functionPriceTierOptions(item);
  return {
    tierId,
    roleUnits,
    saving,
    tierOptions,
    setRoleUnits,
    setSaving,
    selectTier: (next: string) => {
      setTierId(next || OPTIONAL_SELECT_NONE);
      setRoleUnits(draftsForSelection(item, pairs, next || OPTIONAL_SELECT_NONE));
    },
  };
}

type FunctionPriceForm = ReturnType<typeof useFunctionPriceForm>;

function draftsForSelection(
  item: DeliveryFunctionOperationalDto | undefined,
  pairs: LiveFunctionPrice[],
  selection: string,
): RoleUnitDraftRow[] {
  const current = pairForSelection(item, pairs, selection);
  const source = current?.draft ?? current?.published ?? null;
  return source ? roleUnitDraftsFromDto(source.roleUnits) : createEmptyRoleUnitDrafts();
}

function FunctionPriceFields({ form }: { form: FunctionPriceForm }) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <>
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
          onValueChange={(value) => form.selectTier(value)}
        />
      ) : null}
      <RoleUnitsEditor rows={form.roleUnits} disabled={form.saving} onChange={form.setRoleUnits} />
    </>
  );
}

async function submitFunctionPrice(input: {
  catalog: readonly DeliveryFunctionOperationalDto[];
  item: DeliveryFunctionOperationalDto | undefined;
  focusFunctionId: string;
  focused: LiveFunctionPrice[];
  form: FunctionPriceForm;
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
    functionId: input.focusFunctionId,
    tierId: input.form.tierId,
  });
  if (!target.ok) {
    input.onError(target.error === 'function' ? input.missingFunction : input.missingTier);
    return;
  }
  input.form.setSaving(true);
  try {
    await persistFunctionPrice(input.item, input.focused, input.form.tierId, target, roleUnits);
    input.onCreated();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.form.setSaving(false);
  }
}

async function persistFunctionPrice(
  item: DeliveryFunctionOperationalDto | undefined,
  pairs: LiveFunctionPrice[],
  selection: string,
  target: { functionId: string; tierId: string | null },
  roleUnits: NonNullable<ReturnType<typeof buildCompleteRoleUnitVector>>,
): Promise<void> {
  const existing = pairForSelection(item, pairs, selection);
  if (existing?.draft) {
    await deliveryNormsApi.updateFunctionPriceDraft(existing.draft.id, { roleUnits });
    return;
  }
  await deliveryNormsApi.createFunctionPrice(
    parseFunctionPriceWriteBody({
      functionId: target.functionId,
      tierId: target.tierId,
      effectiveFrom: dateInputToIso(todayDateInputValue()),
      roleUnits,
    }),
  );
}
