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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PARTNER_LEVELS,
  PARTNER_DIRECTIONS,
  PARTNER_STATUSES,
  PARTNER_DEFAULT_PERCENT_MIN,
  PARTNER_DEFAULT_PERCENT_MAX,
} from '@/features/partners/constants/partners';
import {
  parsePartnerDefaultPercentInput,
  formatPartnerDefaultPercentForForm,
} from '@/features/partners/utils/partner-default-percent';
import { sliceIsoToDateInput } from '@/features/partners/utils/partner-detail-format';
import { PartnerNotesStartFields } from '@/features/partners/components/PartnerNotesStartFields';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { getApiErrorMessage } from '@/lib/api-errors';

import { PARTNER_CONTACTS_PAGE_SIZE } from '@/features/partners/constants/partner-contacts-page-size';

interface EditPartnerDialogProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Partner) => void;
  forceNestedBackdrop?: boolean;
}

export function EditPartnerDialog({
  partner,
  open,
  onOpenChange,
  onSaved,
  forceNestedBackdrop = false,
}: EditPartnerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    level: 'REGULAR',
    direction: 'INBOUND',
    defaultPercent: '',
    status: 'ACTIVE',
    contactId: 'none',
    notes: '',
    startDate: '',
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setContactsLoading(true);
    setContactsError(null);
    contactsApi
      .getAll({ page: 1, pageSize: PARTNER_CONTACTS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setContacts(res.items);
          setContactsError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setContacts([]);
          setContactsError(
            getApiErrorMessage(
              caught,
              'Contacts could not be loaded. You can still save without changing the linked contact.',
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !partner) return;
    setForm({
      name: partner.name,
      level: partner.level,
      direction: partner.direction,
      defaultPercent: formatPartnerDefaultPercentForForm(partner.defaultPercent),
      status: partner.status,
      contactId: partner.contactId ?? 'none',
      notes: partner.notes ?? '',
      startDate: sliceIsoToDateInput(partner.startDate),
    });
    setFormError(null);
  }, [open, partner]);

  const pct = parsePartnerDefaultPercentInput(form.defaultPercent);
  const canSubmit = Boolean(partner && form.name.trim()) && pct !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !canSubmit || pct === null) return;

    setLoading(true);
    setFormError(null);
    try {
      const updated = await partnersApi.update(partner.id, {
        name: form.name.trim(),
        level: form.level,
        direction: form.direction,
        defaultPercent: pct,
        status: form.status,
        contactId: form.contactId === 'none' ? null : form.contactId,
        notes: form.notes.trim() || null,
        startDate: form.startDate.trim() || null,
      });
      onSaved(updated);
      onOpenChange(false);
    } catch (caught) {
      setFormError(
        getApiErrorMessage(
          caught,
          'Partner could not be saved. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]"
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <DialogHeader>
          <DialogTitle>Edit Partner</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          <div>
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Partner name"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Level</Label>
              <Select
                value={form.level}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, level: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_LEVELS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Direction</Label>
              <Select
                value={form.direction}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, direction: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_DIRECTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Default %</Label>
              <Input
                inputMode="decimal"
                value={form.defaultPercent}
                onChange={(e) => setForm({ ...form, defaultPercent: e.target.value })}
                aria-invalid={form.defaultPercent.trim() !== '' && pct === null}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                {PARTNER_DEFAULT_PERCENT_MIN}–{PARTNER_DEFAULT_PERCENT_MAX}
              </p>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, status: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <PartnerNotesStartFields
            notes={form.notes}
            startDate={form.startDate}
            onNotesChange={(notes) => setForm({ ...form, notes })}
            onStartDateChange={(startDate) => setForm({ ...form, startDate })}
          />

          <div>
            <Label>Primary contact</Label>
            {contactsError ? (
              <p className="text-destructive mb-1 text-sm" role="alert">
                {contactsError}
              </p>
            ) : null}
            <Select
              value={form.contactId}
              onValueChange={(v) => {
                if (v) setForm({ ...form, contactId: v });
              }}
              disabled={contactsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={contactsLoading ? 'Loading contacts…' : 'Optional'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
