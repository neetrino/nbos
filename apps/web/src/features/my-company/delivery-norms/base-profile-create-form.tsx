'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { BaseProfileConfigFields, BaseProfileIdentityFields } from './base-profile-form-fields';
import { buildBaseProfileWriteBody, emptyProfileDraft } from './base-profile-draft';
import { DeliveryNormsFormBlock } from './delivery-norms-form-block';
import { IncludedFunctionsPicker } from './included-functions-picker';
import { messageFromCaught } from './message-from-caught';
import { RoleUnitsEditor } from './role-units-editor';

export function BaseProfileCreateForm({
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
  const [draft, setDraft] = useState(emptyProfileDraft);
  const [saving, setSaving] = useState(false);

  return (
    <DeliveryNormsFormBlock title={t('profiles.createTitle')}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitProfile({
            draft,
            fallback: t('errors.create'),
            invalidDate: t('errors.effectiveFrom'),
            invalidUnits: t('errors.roleUnits'),
            onError,
            onCreated: () => {
              setDraft(emptyProfileDraft());
              onCreated();
            },
            setSaving,
          });
        }}
      >
        <BaseProfileIdentityFields
          draft={draft}
          disabled={Boolean(disabled || saving)}
          onChange={setDraft}
        />
        <BaseProfileConfigFields
          draft={draft}
          disabled={Boolean(disabled || saving)}
          onChange={setDraft}
        />
        <RoleUnitsEditor
          rows={draft.roleUnits}
          disabled={disabled || saving}
          onChange={(roleUnits) => setDraft((current) => ({ ...current, roleUnits }))}
        />
        <IncludedFunctionsPicker
          options={catalog}
          selectedIds={draft.includedFunctionIds}
          disabled={disabled || saving}
          onChange={(includedFunctionIds) =>
            setDraft((current) => ({ ...current, includedFunctionIds }))
          }
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={disabled || saving}>
            {saving ? t('create.creating') : t('create.profile')}
          </Button>
        </div>
      </form>
    </DeliveryNormsFormBlock>
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
