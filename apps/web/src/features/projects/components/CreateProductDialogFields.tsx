'use client';

import { useTranslations } from 'next-intl';
import {
  allowedProductPlatforms,
  coerceOptionalProductPlatform,
  keepProductTypeAfterPlatformChange,
  productPlatformPickerApplies,
  productTypeFieldReady,
} from '@nbos/shared';
import { InlineField } from '@/components/shared';
import { CodeProductTypePicker } from '@/features/crm/components/code-product-type-picker/code-product-type-picker';

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
      <InlineField
        variant="controlled"
        label={t('product.fields.category')}
        type="select"
        value={form.productCategory}
        options={categoryOptions}
        placeholder={t('product.placeholders.selectCategory')}
        onValueChange={(productCategory) => onFormChange(categoryChange(productCategory))}
      />
      {productPlatformPickerApplies(form.productCategory) ? (
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
      {productTypeFieldReady({
        productCategory: form.productCategory,
        productPlatform: form.productPlatform,
      }) ? (
        <CreateProductTypeField form={form} typeOptions={typeOptions} onFormChange={onFormChange} />
      ) : null}
    </>
  );
}

function CreateProductTypeField({
  form,
  typeOptions,
  onFormChange,
}: Omit<CreateProductDialogFieldsProps, 'categoryOptions'>) {
  const t = useTranslations('forms');
  const onTypeChange = (productType: string) => onFormChange(typeChange(form, productType));
  if (form.productCategory !== 'CODE') {
    return (
      <InlineField
        variant="controlled"
        label={t('product.fields.type')}
        type="select"
        value={form.productType}
        options={typeOptions}
        placeholder={t('product.placeholders.selectType')}
        onValueChange={onTypeChange}
      />
    );
  }
  return (
    <CodeProductTypePicker
      label={t('product.fields.type')}
      value={form.productType}
      options={typeOptions.map((option) => ({
        value: option.value,
        label: option.label,
        description: t(`product.typeDescriptions.${option.value}` as never),
      }))}
      placeholder={t('product.placeholders.selectType')}
      searchPlaceholder={t('product.placeholders.searchType')}
      emptyLabel={t('product.emptyTypeSearch')}
      onValueChange={onTypeChange}
    />
  );
}

function categoryChange(productCategory: string): Partial<CreateProductFormState> {
  return {
    productCategory,
    productType: '',
    productPlatform: formPlatform({ productCategory, productType: '', requested: null }),
  };
}

function typeChange(
  form: CreateProductFormState,
  productType: string,
): Partial<CreateProductFormState> {
  return {
    productType,
    productPlatform: formPlatform({
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
  const nextPlatform = formPlatform({
    productCategory: form.productCategory,
    productType: form.productType,
    requested: productPlatform,
  });
  return {
    productPlatform: nextPlatform,
    productType:
      keepProductTypeAfterPlatformChange(
        form.productCategory,
        form.productType || null,
        nextPlatform,
      ) ?? '',
  };
}

function formPlatform(input: {
  productCategory?: string | null;
  productType?: string | null;
  requested?: string | null;
}): string {
  return coerceOptionalProductPlatform(input) ?? '';
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
