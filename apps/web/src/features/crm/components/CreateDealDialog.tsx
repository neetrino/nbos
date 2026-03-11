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
import { DEAL_TYPES, PAYMENT_TYPES } from '../constants/dealPipeline';
import { dealsApi } from '@/lib/api/deals';

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
    contactId: prefill?.contactId ?? ('' as string),
    type: 'NEW_CLIENT',
    amount: '',
    paymentType: 'SPLIT_50_50',
    sellerId: '',
    notes: '',
  });

  const canSubmit = form.contactId && form.type && form.sellerId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await dealsApi.create({
        leadId: prefill?.leadId,
        contactId: form.contactId,
        type: form.type,
        amount: form.amount ? Number(form.amount) : undefined,
        paymentType: form.paymentType || undefined,
        sellerId: form.sellerId,
        notes: form.notes || undefined,
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
