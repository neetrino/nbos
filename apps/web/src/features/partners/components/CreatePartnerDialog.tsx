'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RelationPickerField } from '@/components/shared';
import {
  useContactRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import {
  PARTNER_LEVELS,
  PARTNER_DIRECTIONS,
  PARTNER_STATUSES,
  DEFAULT_PARTNER_DEFAULT_PERCENT,
  PARTNER_DEFAULT_PERCENT_MIN,
  PARTNER_DEFAULT_PERCENT_MAX,
} from '@/features/partners/constants/partners';
import { parsePartnerDefaultPercentInput } from '@/features/partners/utils/partner-default-percent';
import { PartnerNotesStartFields } from '@/features/partners/components/PartnerNotesStartFields';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';

interface CreatePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (partner?: Partner) => void;
  defaultName?: string;
}

export function CreatePartnerDialog({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
}: CreatePartnerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [contactLabel, setContactLabel] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    level: 'REGULAR',
    direction: 'INBOUND',
    defaultPercent: String(DEFAULT_PARTNER_DEFAULT_PERCENT),
    status: 'ACTIVE',
    contactId: 'none',
    notes: '',
    startDate: '',
  });
  const searchContacts = useContactRelationSearch();
  const contactPicker = useRelationPickerActions('contact');

  useEffect(() => {
    if (!open || !defaultName.trim()) return;
    setForm((prev) => ({ ...prev, name: defaultName.trim() }));
  }, [open, defaultName]);

  const reset = () => {
    setForm({
      name: '',
      level: 'REGULAR',
      direction: 'INBOUND',
      defaultPercent: String(DEFAULT_PARTNER_DEFAULT_PERCENT),
      status: 'ACTIVE',
      contactId: 'none',
      notes: '',
      startDate: '',
    });
    setFormError(null);
    setContactLabel(null);
  };

  const pctPreview = parsePartnerDefaultPercentInput(form.defaultPercent);
  const canSubmit = Boolean(form.name.trim()) && pctPreview !== null;
  const contactValue = form.contactId === 'none' ? null : form.contactId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const pct = parsePartnerDefaultPercentInput(form.defaultPercent);
    if (pct === null) return;

    setLoading(true);
    setFormError(null);
    try {
      const created = await partnersApi.create({
        name: form.name.trim(),
        level: form.level,
        direction: form.direction,
        defaultPercent: pct,
        status: form.status,
        ...(form.contactId !== 'none' ? { contactId: form.contactId } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        ...(form.startDate.trim() ? { startDate: form.startDate.trim() } : {}),
      });
      onCreated?.(created);
      onOpenChange(false);
      reset();
    } catch (caught) {
      setFormError(
        getApiErrorMessage(
          caught,
          'Partner could not be created. Check your connection and try again.',
        ),
      );
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New Partner</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Partner name"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label>Default %</Label>
              <Input
                inputMode="decimal"
                value={form.defaultPercent}
                onChange={(e) => setForm({ ...form, defaultPercent: e.target.value })}
                aria-invalid={form.defaultPercent.trim() !== '' && pctPreview === null}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                {PARTNER_DEFAULT_PERCENT_MIN}–{PARTNER_DEFAULT_PERCENT_MAX}
              </p>
            </div>
            <div className="space-y-1.5">
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

          <RelationPickerField
            label="Primary contact"
            entityKind="contact"
            value={contactValue}
            selectionLabel={contactLabel}
            placeholder="Optional — search contacts…"
            icon={<User size={12} />}
            onSearch={searchContacts}
            onSelect={(id, label) => {
              setForm((prev) => ({ ...prev, contactId: id }));
              setContactLabel(label);
            }}
            onClear={() => {
              setForm((prev) => ({ ...prev, contactId: 'none' }));
              setContactLabel(null);
            }}
            {...contactPicker}
          />

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
