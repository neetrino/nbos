'use client';

import { useTranslations } from 'next-intl';
import { Tag } from 'lucide-react';
import { InlineField } from '@/components/shared';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';
import { translateProductTypeDescription, translateProductTypeLabel } from '../i18n/crm-copy';
import { CodeProductTypePicker } from './code-product-type-picker/code-product-type-picker';
import { buildDealTaxonomyPatch, type DealGeneralDraft } from './deal-general-form-state';

const PRODUCT_TYPE_ICON_SIZE_PX = 12;

type DealInfoProductTypeFieldProps = {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  filteredProductTypeOptions: Array<{ value: string; label: string }>;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
};

export function DealInfoProductTypeField({
  draft,
  patchDraft,
  filteredProductTypeOptions,
  disabled = false,
  gateRequiredFields = new Set(),
}: DealInfoProductTypeFieldProps) {
  const t = useTranslations('crm');
  const options = toCodeProductTypeOptions(t, filteredProductTypeOptions);
  const onTypeChange = (nextType: string) =>
    patchDraft(
      buildDealTaxonomyPatch(draft.productCategory, nextType || null, draft.productPlatform),
    );
  const fieldClass = dealStageGateFieldClass(gateRequiredFields, 'productType');

  if (draft.productCategory === 'CODE') {
    return (
      <CodeProductTypePicker
        label={t('dealSheet.productType')}
        value={draft.productType ?? ''}
        options={options}
        placeholder={t('dealSheet.selectProductType')}
        searchPlaceholder={t('dealSheet.searchProductType')}
        emptyLabel={t('dealSheet.emptyProductTypeSearch')}
        icon={<Tag size={PRODUCT_TYPE_ICON_SIZE_PX} />}
        clearable
        disabled={disabled}
        className={fieldClass}
        onValueChange={onTypeChange}
      />
    );
  }

  return (
    <InlineField
      variant="controlled"
      label={t('dealSheet.productType')}
      type="select"
      value={draft.productType ?? ''}
      options={options.map((option) => ({ value: option.value, label: option.label }))}
      placeholder={t('dealSheet.selectProductType')}
      icon={<Tag size={PRODUCT_TYPE_ICON_SIZE_PX} />}
      clearable
      disabled={disabled}
      className={fieldClass}
      onValueChange={onTypeChange}
    />
  );
}

function toCodeProductTypeOptions(
  t: ReturnType<typeof useTranslations<'crm'>>,
  filteredProductTypeOptions: Array<{ value: string; label: string }>,
) {
  return filteredProductTypeOptions.map((option) => ({
    value: option.value,
    label: translateProductTypeLabel(t, option.value),
    description: translateProductTypeDescription(t, option.value),
  }));
}
