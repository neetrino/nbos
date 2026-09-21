'use client';

import { useTranslations } from 'next-intl';
import { allowedProductPlatforms, coerceProductPlatform } from '@nbos/shared';
import { FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';

export interface CreateProductFormState {
  name: string;
  productCategory: string;
  productType: string;
  productPlatform: string;
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
      <CreateProductTaxonomyFields
        form={form}
        categoryOptions={categoryOptions}
        typeOptions={typeOptions}
        onFormChange={onFormChange}
      />
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

function CreateProductTaxonomyFields({
  form,
  categoryOptions,
  typeOptions,
  onFormChange,
}: CreateProductDialogFieldsProps) {
  const t = useTranslations('forms');
  return (
    <>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('product.fields.category')}
          type="select"
          value={form.productCategory}
          options={categoryOptions}
          placeholder={t('product.placeholders.selectCategory')}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(productCategory) => onFormChange(categoryChange(productCategory))}
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
            onValueChange={(productType) => onFormChange(typeChange(form, productType))}
          />
        ) : null}
      </FormFieldRow>
      {form.productCategory ? (
        <InlineField
          variant="controlled"
          label={t('product.fields.platform')}
          type="select"
          value={form.productPlatform}
          options={platformOptions(t, form.productCategory)}
          placeholder={t('product.placeholders.selectPlatform')}
          onValueChange={(productPlatform) => {
            if (!productPlatform) return;
            onFormChange(platformChange(form, productPlatform));
          }}
        />
      ) : null}
    </>
  );
}

function categoryChange(productCategory: string): Partial<CreateProductFormState> {
  return {
    productCategory,
    productType: '',
    productPlatform: productCategory
      ? coerceProductPlatform({ productCategory, productType: '', requested: null })
      : '',
  };
}

function typeChange(
  form: CreateProductFormState,
  productType: string,
): Partial<CreateProductFormState> {
  return {
    productType,
    productPlatform: coerceProductPlatform({
      productCategory: form.productCategory,
      productType,
      requested: productType === 'MOBILE_APP' ? 'APP' : form.productPlatform,
    }),
  };
}

function platformChange(
  form: CreateProductFormState,
  productPlatform: string,
): Partial<CreateProductFormState> {
  return {
    productPlatform: coerceProductPlatform({
      productCategory: form.productCategory,
      productType: form.productType,
      requested: productPlatform,
    }),
  };
}

function platformOptions(
  t: ReturnType<typeof useTranslations<'forms'>>,
  productCategory: string,
): Array<{ value: string; label: string }> {
  return allowedProductPlatforms(productCategory).map((value) => ({
    value,
    label: t(`product.platforms.${value}` as never),
  }));
}
