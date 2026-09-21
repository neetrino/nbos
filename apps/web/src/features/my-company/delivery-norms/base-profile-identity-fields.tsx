'use client';

import { useTranslations } from 'next-intl';
import {
  DELIVERY_ENTITY_KINDS,
  isHiddenFromNewProductTypePick,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from '@nbos/shared';
import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { OPTIONAL_SELECT_NONE, SHEET_STACK_CLASS } from './delivery-norms.constants';
import type { ProfileDraft } from './base-profile-draft';
import { DeliveryNormsSearchSelect } from './delivery-norms-search-select';
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
    <div className={SHEET_STACK_CLASS}>
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
        onValueChange={(entityKind) =>
          applySelectValue(DELIVERY_ENTITY_KINDS, entityKind, (next) =>
            onChange({ ...draft, entityKind: next }),
          )
        }
      />
      <DeliveryNormsSearchSelect
        label={t('fields.productType')}
        value={draft.productType === OPTIONAL_SELECT_NONE ? null : draft.productType}
        placeholder={t('none')}
        disabled={disabled}
        options={selectOptionsFromRecord(
          offeredNormsProductTypes(draft.productType),
          productTypeLabels(t),
        )}
        onChange={(value) => {
          if (value === null) {
            onChange({ ...draft, productType: OPTIONAL_SELECT_NONE });
            return;
          }
          applySelectValue(PRODUCT_TYPES, value, (productType) =>
            onChange({ ...draft, productType }),
          );
        }}
      />
      <DeliveryNormsSearchSelect
        label={t('fields.productCategory')}
        value={draft.productCategory === OPTIONAL_SELECT_NONE ? null : draft.productCategory}
        placeholder={t('none')}
        disabled={disabled}
        options={selectOptionsFromRecord(PRODUCT_CATEGORIES, productCategoryLabels(t))}
        onChange={(value) => {
          if (value === null) {
            onChange({ ...draft, productCategory: OPTIONAL_SELECT_NONE });
            return;
          }
          applySelectValue(PRODUCT_CATEGORIES, value, (productCategory) =>
            onChange({ ...draft, productCategory }),
          );
        }}
      />
    </div>
  );
}

function offeredNormsProductTypes(currentType: string): readonly (typeof PRODUCT_TYPES)[number][] {
  return PRODUCT_TYPES.filter(
    (type) => type === currentType || !isHiddenFromNewProductTypePick(type),
  );
}
