'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  parseBaseProfileWriteBody,
  type DeliveryBaseProfileFinancialDto,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { dateInputToIso, todayDateInputValue } from './effective-from';
import { IncludedFunctionsPicker } from './included-functions-picker';
import type { LiveNormPair } from './live-norm-pair';
import { messageFromCaught } from './message-from-caught';
import { DeliveryNormsCreateSheet } from './delivery-norms-create-sheet';
import { RoleUnitsEditor } from './role-units-editor';
import {
  buildCompleteRoleUnitVector,
  createEmptyRoleUnitDrafts,
  roleUnitDraftsFromDto,
  type RoleUnitDraftRow,
} from './role-units-draft';

type CoreUnitSheetProps = {
  open: boolean;
  productType: string;
  title: string;
  pair: LiveNormPair<DeliveryBaseProfileFinancialDto> | null;
  catalog: DeliveryFunctionOperationalDto[];
  canSave: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onError: (message: string) => void;
};

export function CoreUnitSheet(props: CoreUnitSheetProps) {
  const source = props.pair?.draft ?? props.pair?.published ?? null;
  return <CoreUnitSheetBody key={source?.id ?? props.productType} {...props} source={source} />;
}

function useCoreUnitForm(source: DeliveryBaseProfileFinancialDto | null) {
  const [roleUnits, setRoleUnits] = useState<RoleUnitDraftRow[]>(
    source ? roleUnitDraftsFromDto(source.roleUnits) : createEmptyRoleUnitDrafts(),
  );
  const [includedFunctionIds, setIncludedFunctionIds] = useState(source?.includedFunctionIds ?? []);
  const [saving, setSaving] = useState(false);
  return {
    roleUnits,
    setRoleUnits,
    includedFunctionIds,
    setIncludedFunctionIds,
    saving,
    setSaving,
  };
}

function CoreUnitSheetBody({
  open,
  productType,
  title,
  pair,
  catalog,
  canSave,
  onOpenChange,
  onSaved,
  onError,
  source,
}: CoreUnitSheetProps & { source: DeliveryBaseProfileFinancialDto | null }) {
  const t = useTranslations('hr.deliveryNorms');
  const form = useCoreUnitForm(source);
  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={t('cores.editHint')}
      dirty={canSave}
      saving={form.saving}
      saveLabel={form.saving ? t('create.creating') : t('edit.save')}
      onSave={() => {
        void saveCoreUnit({
          productType,
          draftId: pair?.draft?.id ?? null,
          roleUnits: form.roleUnits,
          includedFunctionIds: form.includedFunctionIds,
          canSave,
          invalidUnits: t('errors.roleUnits'),
          fallback: t('errors.create'),
          onError,
          onSaved,
          setSaving: form.setSaving,
        });
      }}
    >
      <CoreUnitFields
        catalog={catalog}
        disabled={form.saving || !canSave}
        roleUnits={form.roleUnits}
        includedFunctionIds={form.includedFunctionIds}
        onRoleUnits={form.setRoleUnits}
        onIncluded={form.setIncludedFunctionIds}
      />
    </DeliveryNormsCreateSheet>
  );
}

function CoreUnitFields({
  catalog,
  disabled,
  roleUnits,
  includedFunctionIds,
  onRoleUnits,
  onIncluded,
}: {
  catalog: DeliveryFunctionOperationalDto[];
  disabled: boolean;
  roleUnits: RoleUnitDraftRow[];
  includedFunctionIds: string[];
  onRoleUnits: (rows: RoleUnitDraftRow[]) => void;
  onIncluded: (ids: string[]) => void;
}) {
  return (
    <>
      <RoleUnitsEditor rows={roleUnits} disabled={disabled} onChange={onRoleUnits} />
      <IncludedFunctionsPicker
        options={catalog}
        selectedIds={includedFunctionIds}
        disabled={disabled}
        onChange={onIncluded}
      />
    </>
  );
}

async function saveCoreUnit(input: {
  productType: string;
  draftId: string | null;
  roleUnits: RoleUnitDraftRow[];
  includedFunctionIds: string[];
  canSave: boolean;
  invalidUnits: string;
  fallback: string;
  onError: (message: string) => void;
  onSaved: () => void;
  setSaving: (saving: boolean) => void;
}): Promise<void> {
  if (!input.canSave) return;
  const roleUnits = buildCompleteRoleUnitVector(input.roleUnits);
  if (roleUnits === null) {
    input.onError(input.invalidUnits);
    return;
  }
  input.setSaving(true);
  try {
    await persistCoreUnit(input.productType, input.draftId, roleUnits, input.includedFunctionIds);
    input.onSaved();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}

async function persistCoreUnit(
  productType: string,
  draftId: string | null,
  roleUnits: NonNullable<ReturnType<typeof buildCompleteRoleUnitVector>>,
  includedFunctionIds: string[],
): Promise<void> {
  if (draftId) {
    await deliveryNormsApi.updateBaseProfileDraft(draftId, { roleUnits, includedFunctionIds });
    return;
  }
  await deliveryNormsApi.createBaseProfile(
    parseBaseProfileWriteBody({
      productType,
      effectiveFrom: dateInputToIso(todayDateInputValue()),
      roleUnits,
      includedFunctionIds,
    }),
  );
}
