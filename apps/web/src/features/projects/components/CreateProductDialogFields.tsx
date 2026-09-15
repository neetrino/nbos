'use client';

import { useTranslations } from 'next-intl';
import { FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';

export interface CreateProductFormState {
  name: string;
  productCategory: string;
  productType: string;
  description: string;
  deadline: string;
}

interface CreateProductDialogFieldsProps {
  form: CreateProductFormState;
  categoryOptions: Array<{ value: string; label: string }>;
  typeOptions: Array<{ value: string; label: string }>;
  onFormChange: (partial: Partial<CreateProductFormState>) => void;
}

export function CreateProductDialogFields({
  form,
  categoryOptions,
  typeOptions,
  onFormChange,
}: CreateProductDialogFieldsProps) {
  const t = useTranslations('forms');
  return (
    <>
      <InlineField
        variant="controlled"
        label={t('product.fields.name')}
        type="text"
        value={form.name}
        placeholder={t('product.placeholders.name')}
        onValueChange={(name) => onFormChange({ name })}
      />
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('product.fields.category')}
          type="select"
          value={form.productCategory}
          options={categoryOptions}
          placeholder={t('product.placeholders.selectCategory')}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(productCategory) => onFormChange({ productCategory, productType: '' })}
        />
        {form.productCategory ? (
          <InlineField
            variant="controlled"
            label={t('product.fields.type')}
            type="select"
            value={form.productType}
            options={typeOptions}
            placeholder={t('product.placeholders.selectType')}
            className={FORM_FIELD_CELL_CLASS}
            onValueChange={(productType) => onFormChange({ productType })}
          />
        ) : null}
      </FormFieldRow>
      <InlineField
        variant="controlled"
        label={t('product.fields.deadline')}
        type="date"
        datePickerVariant="extended"
        value={form.deadline}
        onValueChange={(deadline) => onFormChange({ deadline })}
      />
      <InlineField
        variant="controlled"
        label={t('product.fields.description')}
        type="textarea"
        value={form.description}
        placeholder={t('product.placeholders.description')}
        onValueChange={(description) => onFormChange({ description })}
      />
    </>
  );
}
