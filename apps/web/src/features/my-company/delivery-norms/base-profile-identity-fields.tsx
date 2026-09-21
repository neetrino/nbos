'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_ENTITY_KINDS, PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@nbos/shared';
import { DetailSheetFieldSegmented, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import type { ProfileDraft } from './base-profile-draft';
import { productCategoryLabels, productTypeLabels } from './profile-enum-labels';
import { selectOptionsFromRecord, applySelectValue } from './select-options-from-record';

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
    <div className="space-y-3">
      <FormFieldRow>
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.profileKey')}
          value={draft.profileKey}
          disabled={disabled}
          onValueChange={(profileKey) => onChange({ ...draft, profileKey })}
        />
        <DetailSheetFieldSegmented
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.entityKind')}
          value={draft.entityKind}
          disabled={disabled}
          options={selectOptionsFromRecord(DELIVERY_ENTITY_KINDS, {
            PRODUCT: t('entityKinds.PRODUCT'),
            EXTENSION: t('entityKinds.EXTENSION'),
          })}
          onValueChange={(entityKind) => onChange({ ...draft, entityKind })}
        />
      </FormFieldRow>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          type="select"
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.productType')}
          value={draft.productType}
          disabled={disabled}
          options={selectOptionsFromRecord([OPTIONAL_SELECT_NONE, ...PRODUCT_TYPES], {
            [OPTIONAL_SELECT_NONE]: t('none'),
            ...productTypeLabels(t),
          })}
          onValueChange={(value) =>
            applySelectValue([OPTIONAL_SELECT_NONE, ...PRODUCT_TYPES], value, (productType) =>
              onChange({ ...draft, productType }),
            )
          }
        />
        <InlineField
          variant="controlled"
          type="select"
          className={FORM_FIELD_CELL_CLASS}
          label={t('fields.productCategory')}
          value={draft.productCategory}
          disabled={disabled}
          options={selectOptionsFromRecord([OPTIONAL_SELECT_NONE, ...PRODUCT_CATEGORIES], {
            [OPTIONAL_SELECT_NONE]: t('none'),
            ...productCategoryLabels(t),
          })}
          onValueChange={(value) =>
            applySelectValue(
              [OPTIONAL_SELECT_NONE, ...PRODUCT_CATEGORIES],
              value,
              (productCategory) => onChange({ ...draft, productCategory }),
            )
          }
        />
      </FormFieldRow>
    </div>
  );
}
