'use client';

import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';

export function FunctionVolumeSelect({
  options,
  value,
  disabled,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (options.length === 0) return null;
  return (
    <InlineField
      variant="controlled"
      type="select"
      className={FORM_FIELD_CELL_CLASS}
      label={t('fields.tier')}
      value={value === OPTIONAL_SELECT_NONE ? '' : value}
      options={options}
      placeholder={t('prices.pickTier')}
      disabled={disabled}
      onValueChange={onChange}
    />
  );
}
