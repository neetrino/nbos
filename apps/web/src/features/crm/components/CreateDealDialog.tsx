'use client';

import { useEffect, useState } from 'react';
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
  DEAL_TYPES,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_CATEGORY,
  PAYMENT_TYPES,
} from '../constants/dealPipeline';
import { LEAD_SOURCES, MARKETING_CHANNELS } from '../constants/leadPipeline';
import { dealsApi } from '@/lib/api/deals';
import { marketingApi, type AttributionOption } from '@/lib/api/marketing';

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  prefill?: {
    leadId?: string;
    contactId?: string;
    contactName?: string;
  };
}

export function CreateDealDialog({
  open,
  onOpenChange,
  onCreated,
  prefill,
}: CreateDealDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactId: prefill?.contactId ?? ('' as string),
    type: 'PRODUCT',
    productCategory: '',
    productType: '',
    amount: '',
    paymentType: 'CLASSIC',
    sellerId: '',
    source: 'MARKETING',
    sourceDetail: '',
    attributionOption: '',
    notes: '',
  });

  const showCategoryField = form.type === 'PRODUCT' || form.type === 'OUTSOURCE';

  const filteredProductTypes = (() => {
    if (!form.productCategory) return [];
    const allowed = PRODUCT_TYPES_BY_CATEGORY[form.productCategory] ?? [];
    if (allowed.length === 0) return PRODUCT_TYPES.map((t) => ({ value: t.value, label: t.label }));
    return PRODUCT_TYPES.filter((t) => allowed.includes(t.value) || t.value === 'OTHER').map(
      (t) => ({ value: t.value, label: t.label }),
    );
  })();

  const canSubmit = form.contactId && form.type && form.sellerId;
  const [attributionOptions, setAttributionOptions] = useState<AttributionOption[]>([]);

  useEffect(() => {
    if (form.source !== 'MARKETING' || !form.sourceDetail) {
      setAttributionOptions([]);
      return;
    }
    marketingApi
      .getAttributionOptions(form.sourceDetail)
      .then(setAttributionOptions)
      .catch(() => setAttributionOptions([]));
  }, [form.source, form.sourceDetail]);

  const selectedAttribution = attributionOptions.find(
    (option) => `${option.type}:${option.id}` === form.attributionOption,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await dealsApi.create({
        name: form.name || undefined,
        leadId: prefill?.leadId,
        contactId: form.contactId,
        type: form.type,
        amount: form.amount ? Number(form.amount) : undefined,
        paymentType: form.paymentType || undefined,
        sellerId: form.sellerId,
        source: form.source,
        sourceDetail: form.sourceDetail || undefined,
        marketingAccountId:
          selectedAttribution?.type === 'ACCOUNT' ? selectedAttribution.id : undefined,
        marketingActivityId:
          selectedAttribution?.type === 'ACTIVITY' ? selectedAttribution.id : undefined,
        notes: form.notes || undefined,
        productCategory: form.productCategory || undefined,
        productType: form.productType || undefined,
      });
      onCreated();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{prefill?.leadId ? 'Convert Lead to Deal' : 'New Deal'}</DialogTitle>
        </DialogHeader>

        {prefill?.contactName && (
          <div className="bg-secondary rounded-lg p-3 text-sm">
            Converting lead: <strong>{prefill.contactName}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Deal Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website redesign, Mobile app"
            />
          </div>

          {!prefill?.contactId && (
            <div>
              <Label>Contact ID *</Label>
              <Input
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                placeholder="Contact ID"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deal Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as string })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Type</Label>
              <Select
                value={form.paymentType || undefined}
                onValueChange={(v) => setForm({ ...form, paymentType: v as string })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showCategoryField && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Product Category</Label>
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
                  <Label>Product Type</Label>
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
          )}

          <div>
            <Label>Amount (AMD)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 1500000"
            />
          </div>

          <div>
            <Label>Seller ID *</Label>
            <Input
              value={form.sellerId}
              onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
              placeholder="Seller employee ID"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>From</Label>
              <Select
                value={form.source}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    source: v as string,
                    sourceDetail: '',
                    attributionOption: '',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Where</Label>
              <Select
                value={form.sourceDetail || undefined}
                onValueChange={(v) =>
                  setForm({ ...form, sourceDetail: v as string, attributionOption: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  {MARKETING_CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Which one</Label>
              <Select
                value={form.attributionOption || undefined}
                onValueChange={(v) => setForm({ ...form, attributionOption: v as string })}
                disabled={form.source !== 'MARKETING' || !form.sourceDetail}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {attributionOptions.map((option) => (
                    <SelectItem
                      key={`${option.type}:${option.id}`}
                      value={`${option.type}:${option.id}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Scope, requirements, client expectations..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
