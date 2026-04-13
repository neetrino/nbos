'use client';

import { useState, useEffect } from 'react';
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
import { EXTENSION_SIZES } from '@/features/projects/constants/projects';
import { extensionsApi, type CreateExtensionData } from '@/lib/api/extensions';
import { productsApi, type Product } from '@/lib/api/products';

interface CreateExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  projectId: string;
  preselectedProductId?: string;
}

export function CreateExtensionDialog({
  open,
  onOpenChange,
  onCreated,
  projectId,
  preselectedProductId,
}: CreateExtensionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: '',
    productId: preselectedProductId ?? '',
    size: 'SMALL',
    description: '',
  });

  useEffect(() => {
    if (open) {
      productsApi
        .getAll({ projectId, pageSize: 100 })
        .then((data) => setProducts(data.items))
        .catch(() => setProducts([]));
    }
  }, [open, projectId]);

  useEffect(() => {
    if (preselectedProductId) {
      setForm((prev) => ({ ...prev, productId: preselectedProductId }));
    }
  }, [preselectedProductId]);

  const canSubmit = form.name.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const data: CreateExtensionData = {
        projectId,
        name: form.name.trim(),
        productId: form.productId || undefined,
        size: form.size,
        description: form.description || undefined,
      };
      await extensionsApi.create(data);
      onCreated();
      onOpenChange(false);
      setForm({ name: '', productId: '', size: 'SMALL', description: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Extension</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Extension Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Add payment integration, New admin panel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Product</Label>
              <Select
                value={form.productId || undefined}
                onValueChange={(v) => setForm({ ...form, productId: v ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Size</Label>
              <Select
                value={form.size}
                onValueChange={(v) => setForm({ ...form, size: v ?? 'SMALL' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXTENSION_SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="What needs to be added or changed..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Extension'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
