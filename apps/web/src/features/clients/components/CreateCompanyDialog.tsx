'use client';

import { useCallback, useEffect, useState } from 'react';
import { User } from 'lucide-react';
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
import { RelationPickerField } from '@/components/shared/relation-picker/RelationPickerField';
import { DetailSheetFieldSegmented } from '@/components/shared';
import type { RelationCreatedEvent } from '@/components/shared/relation-picker/relation-created-event';
import { useRegisterRelationCreated } from '@/components/shared/relation-picker/use-register-relation-created';
import { useRelationPickerActions } from '@/components/shared/relation-picker/use-relation-picker-actions';
import { useContactRelationSearch } from '@/components/shared/relation-picker';
import { COMPANY_TYPES, TAX_STATUSES } from '../constants/clients';
import { companiesApi, type Company } from '@/lib/api/clients';
import { applyCompanyRelationCreated } from './apply-company-relation-created';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (company?: Company) => void;
  defaultName?: string;
}

const EMPTY_FORM = {
  name: '',
  type: 'LEGAL',
  taxStatus: 'TAX',
  taxId: '',
  legalAddress: '',
  contactIds: [] as string[],
  contactLabels: {} as Record<string, string>,
  billingContactId: '',
  billingContactLabel: '',
  phone: '',
  email: '',
  country: '',
  notes: '',
};

export function CreateCompanyDialog({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
}: CreateCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const contactRelationSearch = useContactRelationSearch();
  const contactsPicker = useRelationPickerActions('contact', 'company-create-contacts');
  const billingContactPicker = useRelationPickerActions('contact', 'company-create-billing');
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open || !defaultName.trim()) return;
    setForm((prev) => ({ ...prev, name: defaultName.trim() }));
  }, [open, defaultName]);

  const canSubmit = Boolean(form.name) && Boolean(form.type) && Boolean(form.taxStatus);

  const reset = () => {
    setForm({
      ...EMPTY_FORM,
      contactIds: [],
      contactLabels: {},
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const primaryId = form.contactIds[0] ?? '';
      const created = await companiesApi.create({
        name: form.name,
        type: form.type,
        taxStatus: form.taxStatus,
        taxId: form.taxId || undefined,
        legalAddress: form.legalAddress || undefined,
        contactIds: form.contactIds,
        billingContactId:
          form.billingContactId && form.billingContactId !== primaryId
            ? form.billingContactId
            : undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        country: form.country || undefined,
        notes: form.notes || undefined,
      });
      onCreated?.(created);
      onOpenChange(false);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const handleRelationCreated = useCallback((event: RelationCreatedEvent) => {
    setForm((prev) => ({ ...prev, ...applyCompanyRelationCreated(prev, event) }));
  }, []);

  useRegisterRelationCreated(open ? handleRelationCreated : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>New Company</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label>Company Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Company LLC or Individual Name"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
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
            <DetailSheetFieldSegmented
              label="Tax Status *"
              value={form.taxStatus}
              options={TAX_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              onValueChange={(taxStatus) => setForm({ ...form, taxStatus })}
              ariaLabel="Tax status"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label>Tax ID</Label>
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="Tax ID / VOEN"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Armenia"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Legal Address</Label>
            <Input
              value={form.legalAddress}
              onChange={(e) => setForm({ ...form, legalAddress: e.target.value })}
              placeholder="Legal address..."
            />
          </div>

          <RelationPickerField
            label="Contacts"
            entityKind="contact"
            multiple
            value={form.contactIds}
            selectionLabels={form.contactLabels}
            placeholder="Optional — search or create contact…"
            icon={<User size={12} />}
            maxResults={25}
            onSearch={contactRelationSearch}
            onChange={(ids, labels) =>
              setForm((prev) => ({
                ...prev,
                contactIds: ids,
                contactLabels: labels,
              }))
            }
            {...contactsPicker}
          />

          <RelationPickerField
            label="Billing Contact"
            entityKind="contact"
            value={form.billingContactId || null}
            selectionLabel={form.billingContactLabel || null}
            placeholder="Optional — defaults to primary when empty"
            icon={<User size={12} />}
            maxResults={25}
            onSearch={contactRelationSearch}
            onSelect={(id, label) =>
              setForm((prev) => ({
                ...prev,
                billingContactId: id,
                billingContactLabel: label,
              }))
            }
            onClear={() =>
              setForm((prev) => ({
                ...prev,
                billingContactId: '',
                billingContactLabel: '',
              }))
            }
            {...billingContactPicker}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label>Company Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
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
