'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_ENTITY_KINDS, PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@nbos/shared';
import { Input } from '@/components/ui/input';
import { OPTIONAL_SELECT_NONE, PROFILE_FORM_GRID_CLASS } from './delivery-norms.constants';
import type { ProfileDraft } from './base-profile-draft';
import { NormEnumSelect } from './norm-enum-select';
import { NormField } from './norm-field';
import { productCategoryLabels, productTypeLabels } from './profile-enum-labels';

export function BaseProfileIdentityFields({
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
    <div className={PROFILE_FORM_GRID_CLASS}>
      <NormField label={t('fields.profileKey')}>
        <Input
          value={draft.profileKey}
          disabled={disabled}
          onChange={(event) => onChange({ ...draft, profileKey: event.target.value })}
        />
      </NormField>
      <NormField label={t('fields.entityKind')}>
        <NormEnumSelect
          id="profile-entity-kind"
          value={draft.entityKind}
          options={DELIVERY_ENTITY_KINDS}
          labels={{ PRODUCT: t('entityKinds.PRODUCT'), EXTENSION: t('entityKinds.EXTENSION') }}
          disabled={disabled}
          onChange={(entityKind) => onChange({ ...draft, entityKind })}
        />
      </NormField>
      <NormField label={t('fields.productType')}>
        <NormEnumSelect
          id="profile-product-type"
          value={draft.productType}
          options={[OPTIONAL_SELECT_NONE, ...PRODUCT_TYPES]}
          labels={{ [OPTIONAL_SELECT_NONE]: t('none'), ...productTypeLabels(t) }}
          disabled={disabled}
          onChange={(productType) => onChange({ ...draft, productType })}
        />
      </NormField>
      <NormField label={t('fields.productCategory')}>
        <NormEnumSelect
          id="profile-product-category"
          value={draft.productCategory}
          options={[OPTIONAL_SELECT_NONE, ...PRODUCT_CATEGORIES]}
          labels={{ [OPTIONAL_SELECT_NONE]: t('none'), ...productCategoryLabels(t) }}
          disabled={disabled}
          onChange={(productCategory) => onChange({ ...draft, productCategory })}
        />
      </NormField>
    </div>
  );
}
