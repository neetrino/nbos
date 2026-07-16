'use client';

import { useEffect, useState } from 'react';
import type { RelationCreatePrefill } from '@/components/shared/relation-picker';
import { DetailSheetFieldSegmented } from '@/components/shared';
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
import { CONTACT_ROLES, PREFERRED_CHANNELS, LANGUAGES } from '../constants/clients';
import { contactsApi, type Contact } from '@/lib/api/clients';

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (contact?: Contact) => void;
  prefill?: RelationCreatePrefill | null;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  role: 'CLIENT',
  preferredChannel: '',
  language: '',
  whatsapp: '',
  telegram: '',
  notes: '',
};

export function CreateContactDialog({
  open,
  onOpenChange,
  onCreated,
  prefill = null,
}: CreateContactDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (!prefill) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      ...EMPTY_FORM,
      firstName: prefill.firstName ?? '',
      lastName: prefill.lastName ?? '',
    });
  }, [open, prefill]);

  const canSubmit = form.firstName && form.lastName && form.phone && form.role;

  const reset = () => {
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const created = await contactsApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        role: form.role,
        notes: form.notes || undefined,
        messengerLinks: {
          ...(form.whatsapp && { whatsapp: form.whatsapp }),
          ...(form.telegram && { telegram: form.telegram }),
          ...(form.preferredChannel && { preferredChannel: form.preferredChannel }),
          ...(form.language && { language: form.language }),
        },
      });
      onCreated?.(created);
      onOpenChange(false);
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="John"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+374 XX XXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
          </div>

          <DetailSheetFieldSegmented
            label="Contact Type *"
            value={form.role}
            options={CONTACT_ROLES.map((role) => ({ value: role.value, label: role.label }))}
            onValueChange={(role) => setForm({ ...form, role })}
            ariaLabel="Contact type"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+374..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telegram</Label>
              <Input
                value={form.telegram}
                onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                placeholder="@username"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label>Preferred Channel</Label>
              <Select
                value={form.preferredChannel}
                onValueChange={(v) => setForm({ ...form, preferredChannel: v as string })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PREFERRED_CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select
                value={form.language}
                onValueChange={(v) => setForm({ ...form, language: v as string })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Preferences, important details..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
