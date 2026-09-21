'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { listedProductTypesForPicker, productPlatformApplies } from '@nbos/shared';
import { CreateFormDialog } from '@/components/shared';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/features/projects/constants/projects';
import { productsApi, type CreateProductData, type Product } from '@/lib/api/products';
import {
  CreateProductDialogFields,
  type CreateProductFormState,
} from './CreateProductDialogFields';

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (product?: Product) => void;
  projectId: string;
  defaultName?: string;
  forceNestedBackdrop?: boolean;
}

const EMPTY_PRODUCT_FORM: CreateProductFormState = {
  name: '',
  productCategory: '',
  productType: '',
  productPlatform: '',
  description: '',
  deadline: '',
};

export function CreateProductDialog(props: CreateProductDialogProps) {
  const sessionKey = props.open ? `open:${props.defaultName ?? ''}:${props.projectId}` : 'closed';
  return <CreateProductDialogSession key={sessionKey} {...props} />;
}

function CreateProductDialogSession({
  open,
  onOpenChange,
  onCreated,
  projectId,
  defaultName = '',
  forceNestedBackdrop = false,
}: CreateProductDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateProductFormState>({
    ...EMPTY_PRODUCT_FORM,
    name: defaultName.trim(),
  });
  const categoryOptions = useMemo(
    () =>
      PRODUCT_CATEGORIES.map((category) => ({
        value: category.value,
        label: t(`product.categories.${category.value}` as never),
      })),
    [t],
  );
  const typeOptions = useMemo(() => {
    if (!form.productCategory) return [];
    const listed = listedProductTypesForPicker(
      form.productCategory,
      form.productType,
      form.productPlatform,
    );
    return PRODUCT_TYPES.filter(
      (productType) => listed.includes(productType.value) || productType.value === 'OTHER',
    ).map((productType) => ({
      value: productType.value,
      label: t(`product.types.${productType.value}` as never),
    }));
  }, [form.productCategory, form.productType, form.productPlatform, t]);
  const canSubmit = Boolean(
    form.name.trim() &&
    form.productCategory &&
    form.productType &&
    (!productPlatformApplies(form.productCategory) || form.productPlatform),
  );

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('product.title')}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event) =>
        void submitProduct({
          event,
          canSubmit,
          form,
          projectId,
          setLoading,
          onCreated,
          onOpenChange,
        })
      }
    >
      <CreateProductDialogFields
        form={form}
        categoryOptions={categoryOptions}
        typeOptions={typeOptions}
        onFormChange={(partial) => setForm((prev) => ({ ...prev, ...partial }))}
      />
    </CreateFormDialog>
  );
}

async function submitProduct(options: {
  event: FormEvent;
  canSubmit: boolean;
  form: CreateProductFormState;
  projectId: string;
  setLoading: (loading: boolean) => void;
  onCreated?: (product?: Product) => void;
  onOpenChange: (open: boolean) => void;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit) return;
  options.setLoading(true);
  try {
    const data: CreateProductData = {
      projectId: options.projectId,
      name: options.form.name.trim(),
      productCategory: options.form.productCategory,
      productType: options.form.productType,
      productPlatform: options.form.productPlatform || null,
      description: options.form.description || undefined,
      deadline: options.form.deadline || undefined,
    };
    options.onCreated?.(await productsApi.create(data));
    options.onOpenChange(false);
  } finally {
    options.setLoading(false);
  }
}
