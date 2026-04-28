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
  PARTNER_TYPES,
  PARTNER_DIRECTIONS,
  PARTNER_STATUSES,
  DEFAULT_PARTNER_DEFAULT_PERCENT,
  PARTNER_DEFAULT_PERCENT_MIN,
  PARTNER_DEFAULT_PERCENT_MAX,
} from '@/features/partners/constants/partners';
import { partnersApi } from '@/lib/api/partners';
import { contactsApi, type Contact } from '@/lib/api/clients';

const CONTACTS_PAGE_SIZE = 200;

interface CreatePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreatePartnerDialog({ open, onOpenChange, onCreated }: CreatePartnerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'REGULAR',
    direction: 'INBOUND',
    defaultPercent: String(DEFAULT_PARTNER_DEFAULT_PERCENT),
    status: 'ACTIVE',
    contactId: 'none',
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setContactsLoading(true);
    contactsApi
      .getAll({ page: 1, pageSize: CONTACTS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setContacts(res.items);
      })
      .catch(() => {
        if (!cancelled) setContacts([]);
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const reset = () => {
    setForm({
      name: '',
      type: 'REGULAR',
      direction: 'INBOUND',
      defaultPercent: String(DEFAULT_PARTNER_DEFAULT_PERCENT),
      status: 'ACTIVE',
      contactId: 'none',
    });
    setFormError(null);
  };

  const parseDefaultPercent = (): number | null => {
    const raw = form.defaultPercent.trim().replace(',', '.');
    const n = Number.parseFloat(raw);
    if (Number.isNaN(n)) return null;
    if (n < PARTNER_DEFAULT_PERCENT_MIN || n > PARTNER_DEFAULT_PERCENT_MAX) return null;
    return n;
  };

  const canSubmit = Boolean(form.name.trim()) && parseDefaultPercent() !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const pct = parseDefaultPercent();
    if (pct === null) return;

    setLoading(true);
    setFormError(null);
    try {
      await partnersApi.create({
        name: form.name.trim(),
        type: form.type,
        direction: form.direction,
        defaultPercent: pct,
        status: form.status,
        ...(form.contactId !== 'none' ? { contactId: form.contactId } : {}),
      });
      onCreated();
      onOpenChange(false);
      reset();
    } catch {
      setFormError('Partner could not be created. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New Partner</DialogTitle>
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
              <Label>Tier</Label>
              <Select
                value={form.type}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, type: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_TYPES.map((t) => (
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
                aria-invalid={form.defaultPercent.trim() !== '' && parseDefaultPercent() === null}
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

          <div>
            <Label>Primary contact</Label>
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
              {loading ? 'Creating…' : 'Create Partner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
