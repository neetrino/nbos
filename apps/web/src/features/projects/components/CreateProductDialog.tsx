'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { productsApi, type CreateProductData } from '@/lib/api/products';

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  projectId: string;
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onCreated,
  projectId,
}: CreateProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    productCategory: '',
    productType: '',
    description: '',
    deadline: '',
  });

  const filteredProductTypes = (() => {
    if (!form.productCategory) return [];
    const allowed = PRODUCT_TYPES_BY_CATEGORY[form.productCategory] ?? [];
    if (allowed.length === 0) return PRODUCT_TYPES.map((t) => ({ value: t.value, label: t.label }));
    return PRODUCT_TYPES.filter((t) => allowed.includes(t.value) || t.value === 'OTHER').map(
      (t) => ({ value: t.value, label: t.label }),
    );
  })();

  const canSubmit = form.name.trim() && form.productCategory && form.productType;

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
      await productsApi.create(data);
      onCreated();
      onOpenChange(false);
      setForm({ name: '', productCategory: '', productType: '', description: '', deadline: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Product Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Company Website, Mobile App"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Product Category *</Label>
              <Select
                value={form.productCategory || undefined}
                onValueChange={(v) =>
                  setForm({ ...form, productCategory: v ?? '', productType: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.productCategory && (
              <div>
                <Label>Product Type *</Label>
                <Select
                  value={form.productType || undefined}
                  onValueChange={(v) => setForm({ ...form, productType: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProductTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label>Deadline</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Product requirements, scope..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
