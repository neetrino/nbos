'use client';

import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { SHEET_STACK_CLASS } from './delivery-norms.constants';
import type { ProfileDraft } from './base-profile-draft';
import { BaseProfileIdentityFields } from './base-profile-identity-fields';

export { BaseProfileIdentityFields };

export function BaseProfileConfigFields({
  draft,
  disabled,
  onChange,
}: {
  draft: ProfileDraft;
  disabled: boolean;
  onChange: (next: ProfileDraft) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={SHEET_STACK_CLASS}>
      <InlineField
        variant="controlled"
        type="date"
        className={FORM_FIELD_CELL_CLASS}
        label={t('fields.effectiveFrom')}
        value={draft.effectiveFrom}
        disabled={disabled}
        onValueChange={(effectiveFrom) => onChange({ ...draft, effectiveFrom })}
      />
      <InlineField
        variant="controlled"
        type="textarea"
        label={t('fields.description')}
        value={draft.description}
        disabled={disabled}
        onValueChange={(description) => onChange({ ...draft, description })}
      />
    </div>
  );
}
