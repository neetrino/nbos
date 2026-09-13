'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_CATEGORY,
} from '@/features/projects/constants/projects';
import { productsApi, type CreateProductData, type Product } from '@/lib/api/products';

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (product?: Product) => void;
  projectId: string;
  defaultName?: string;
  /** When opened above an entity sheet floating rail. */
  forceNestedBackdrop?: boolean;
}

export function CreateProductDialog({
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
  const [form, setForm] = useState({
    name: '',
    productCategory: '',
    productType: '',
    description: '',
    deadline: '',
  });

  const filteredProductTypes = useMemo(() => {
    if (!form.productCategory) return [];
    const allowed = PRODUCT_TYPES_BY_CATEGORY[form.productCategory] ?? [];
    const types =
      allowed.length === 0
        ? PRODUCT_TYPES
        : PRODUCT_TYPES.filter(
            (productType) => allowed.includes(productType.value) || productType.value === 'OTHER',
          );
    return types.map((productType) => ({
      value: productType.value,
      label: t(`product.types.${productType.value}` as never),
    }));
  }, [form.productCategory, t]);

  const canSubmit = form.name.trim() && form.productCategory && form.productType;

  useEffect(() => {
    if (!open || !defaultName.trim()) return;
    setForm((prev) => ({ ...prev, name: defaultName.trim() }));
  }, [open, defaultName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const data: CreateProductData = {
        projectId,
        name: form.name.trim(),
        productCategory: form.productCategory,
        productType: form.productType,
        description: form.description || undefined,
        deadline: form.deadline || undefined,
      };
      const product = await productsApi.create(data);
      onCreated?.(product);
      onOpenChange(false);
      setForm({ name: '', productCategory: '', productType: '', description: '', deadline: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>{t('product.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('product.fields.name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('product.placeholders.name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('product.fields.category')}</Label>
              <Select
                value={form.productCategory || undefined}
                onValueChange={(v) =>
                  setForm({ ...form, productCategory: v ?? '', productType: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('product.placeholders.selectCategory')}>
                    {form.productCategory
                      ? t(`product.categories.${form.productCategory}` as never)
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {t(`product.categories.${category.value}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.productCategory && (
              <div className="space-y-2">
                <Label>{t('product.fields.type')}</Label>
                <Select
                  value={form.productType || undefined}
                  onValueChange={(v) => setForm({ ...form, productType: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('product.placeholders.selectType')}>
                      {form.productType ? t(`product.types.${form.productType}` as never) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProductTypes.map((productType) => (
                      <SelectItem key={productType.value} value={productType.value}>
                        {productType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('product.fields.deadline')}</Label>
            <NbosDatePicker
              value={form.deadline}
              onChange={(deadline) => setForm({ ...form, deadline })}
              variant="extended"
              aria-label={t('product.fields.deadlineAria')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('product.fields.description')}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder={t('product.placeholders.description')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? tCommon('creating') : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
