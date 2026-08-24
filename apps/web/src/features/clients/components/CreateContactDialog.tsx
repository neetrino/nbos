'use client';

import { useEffect, useState } from 'react';
import type { RelationCreatePrefill } from '@/components/shared/relation-picker';
import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CONTACT_ROLES } from '../constants/clients';
import { contactsApi, type Contact } from '@/lib/api/clients';

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (contact?: Contact) => void;
  prefill?: RelationCreatePrefill | null;
  /** When opened above an entity sheet floating rail. */
  forceNestedBackdrop?: boolean;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  role: 'CLIENT',
};

const CONTACT_ROLE_OPTIONS = CONTACT_ROLES.map((role) => ({
  value: role.value,
  label: role.label,
}));

export function CreateContactDialog({
  open,
  onOpenChange,
  onCreated,
  forceNestedBackdrop = false,
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
        role: form.role,
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
      <DialogContent className="bg-card sm:max-w-[540px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InlineField
              variant="controlled"
              label="First name"
              type="text"
              value={form.firstName}
              placeholder="John"
              disabled={loading}
              onValueChange={(firstName) => setForm((prev) => ({ ...prev, firstName }))}
            />
            <InlineField
              variant="controlled"
              label="Last name"
              type="text"
              value={form.lastName}
              placeholder="Smith"
              disabled={loading}
              onValueChange={(lastName) => setForm((prev) => ({ ...prev, lastName }))}
            />
          </div>

          <InlineField
            variant="controlled"
            label="Phone"
            type="phone"
            value={form.phone}
            placeholder="+374 XX XXXXXX"
            disabled={loading}
            onValueChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
          />

          <DetailSheetFieldSegmented
            label="Contact type"
            value={form.role}
            options={CONTACT_ROLE_OPTIONS}
            onValueChange={(role) => setForm((prev) => ({ ...prev, role }))}
            disabled={loading}
            ariaLabel="Contact type"
          />

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
