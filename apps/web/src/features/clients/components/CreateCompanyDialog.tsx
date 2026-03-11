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
import { COMPANY_TYPES, TAX_STATUSES } from '../constants/clients';
import { companiesApi } from '@/lib/api/clients';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateCompanyDialog({ open, onOpenChange, onCreated }: CreateCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'LEGAL',
    taxStatus: 'TAX',
    taxId: '',
    legalAddress: '',
    contactId: '',
    phone: '',
    email: '',
    country: '',
    notes: '',
  });

  const canSubmit = form.name && form.type && form.taxStatus && form.contactId;

  const reset = () => {
    setForm({
      name: '',
      type: 'LEGAL',
      taxStatus: 'TAX',
      taxId: '',
      legalAddress: '',
      contactId: '',
      phone: '',
      email: '',
      country: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await companiesApi.create({
        name: form.name,
        type: form.type,
        taxStatus: form.taxStatus,
        taxId: form.taxId || undefined,
        legalAddress: form.legalAddress || undefined,
        contactId: form.contactId,
        phone: form.phone || undefined,
        email: form.email || undefined,
        notes: form.notes || undefined,
      });
      onCreated();
      onOpenChange(false);
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New Company</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Company Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Company LLC or Individual Name"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as string })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tax Status *</Label>
              <Select
                value={form.taxStatus}
                onValueChange={(v) => setForm({ ...form, taxStatus: v as string })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tax ID</Label>
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="Tax ID / VOEN"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Armenia"
              />
            </div>
          </div>

          <div>
            <Label>Legal Address</Label>
            <Input
              value={form.legalAddress}
              onChange={(e) => setForm({ ...form, legalAddress: e.target.value })}
              placeholder="Legal address..."
            />
          </div>

          <div>
            <Label>Primary Contact ID *</Label>
            <Input
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
              placeholder="Contact ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Company Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Special conditions, bank details..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
