'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { BaseProfileConfigFields, BaseProfileIdentityFields } from './base-profile-form-fields';
import { buildBaseProfileWriteBody, emptyProfileDraft } from './base-profile-draft';
import { DeliveryNormsCreateSheet } from './delivery-norms-create-sheet';
import { IncludedFunctionsPicker } from './included-functions-picker';
import { messageFromCaught } from './message-from-caught';
import { RoleUnitsEditor } from './role-units-editor';
import { SHEET_STACK_CLASS } from './delivery-norms.constants';

type ProfileSheetTab = 'general' | 'units' | 'included';

export function BaseProfileCreateSheet({
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
  const [draft, setDraft] = useState(emptyProfileDraft);
  const [tab, setTab] = useState<ProfileSheetTab>('general');
  const [saving, setSaving] = useState(false);
  const isProduct = draft.entityKind === 'PRODUCT';
  const activeTab: ProfileSheetTab = isProduct || tab !== 'included' ? tab : 'general';

  const tabs = useMemo(
    () => [
      { value: 'general', label: t('sheet.tabs.general') },
      { value: 'units', label: t('sheet.tabs.units') },
      ...(isProduct ? [{ value: 'included', label: t('sheet.tabs.included') }] : []),
    ],
    [isProduct, t],
  );

  return (
    <DeliveryNormsCreateSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setDraft(emptyProfileDraft());
          setTab('general');
        }
        onOpenChange(next);
      }}
      title={t('profiles.createTitle')}
      description={isProduct ? t('profiles.createHint') : t('sheet.includedProductOnly')}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(next) => setTab(next as ProfileSheetTab)}
      dirty
      saving={saving}
      saveLabel={saving ? t('create.creating') : t('create.profile')}
      onSave={() => {
        void submitProfile({
          draft,
          fallback: t('errors.create'),
          invalidDate: t('errors.effectiveFrom'),
          invalidUnits: t('errors.roleUnits'),
          onError,
          onCreated: () => {
            setDraft(emptyProfileDraft());
            onCreated();
            onOpenChange(false);
          },
          setSaving,
        });
      }}
    >
      {activeTab === 'general' ? (
        <div className={SHEET_STACK_CLASS}>
          <BaseProfileIdentityFields
            draft={draft}
            disabled={saving}
            onChange={(next) => {
              setDraft(next);
              if (next.entityKind !== 'PRODUCT') {
                setTab((current) => (current === 'included' ? 'general' : current));
              }
            }}
          />
          <BaseProfileConfigFields draft={draft} disabled={saving} onChange={setDraft} />
        </div>
      ) : null}
      {activeTab === 'units' ? (
        <RoleUnitsEditor
          rows={draft.roleUnits}
          disabled={saving}
          onChange={(roleUnits) => setDraft((current) => ({ ...current, roleUnits }))}
        />
      ) : null}
      {activeTab === 'included' && isProduct ? (
        <IncludedFunctionsPicker
          options={catalog}
          selectedIds={draft.includedFunctionIds}
          disabled={saving}
          onChange={(includedFunctionIds) =>
            setDraft((current) => ({ ...current, includedFunctionIds }))
          }
        />
      ) : null}
    </DeliveryNormsCreateSheet>
  );
}

async function submitProfile(input: {
  draft: ReturnType<typeof emptyProfileDraft>;
  fallback: string;
  invalidDate: string;
  invalidUnits: string;
  onError: (message: string) => void;
  onCreated: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  const parsed = buildBaseProfileWriteBody(input.draft);
  if (parsed.error === 'effectiveFrom') {
    input.onError(input.invalidDate);
    return;
  }
  if (parsed.error === 'roleUnits') {
    input.onError(input.invalidUnits);
    return;
  }
  if (parsed.error !== null) {
    input.onError(messageFromCaught(parsed.caught, input.fallback));
    return;
  }
  input.setSaving(true);
  try {
    await deliveryNormsApi.createBaseProfile(parsed.body);
    input.onCreated();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
