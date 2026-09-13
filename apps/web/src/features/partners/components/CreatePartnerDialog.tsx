'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  /** When opened above an entity sheet floating rail. */
  forceNestedBackdrop?: boolean;
}

export function CreatePartnerDialog({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
  forceNestedBackdrop = false,
}: CreatePartnerDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
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
      setFormError(getApiErrorMessage(caught, t('partner.createError')));
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
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]"
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <DialogHeader>
          <DialogTitle>{t('partner.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label>{t('partner.fields.name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('partner.placeholders.name')}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('partner.fields.level')}</Label>
              <Select
                value={form.level}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, level: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue>{t(`partner.levels.${form.level}` as never)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {t(`partner.levels.${level.value}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('partner.fields.direction')}</Label>
              <Select
                value={form.direction}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, direction: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue>{t(`partner.directions.${form.direction}` as never)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_DIRECTIONS.map((direction) => (
                    <SelectItem key={direction.value} value={direction.value}>
                      {t(`partner.directions.${direction.value}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('partner.fields.defaultPercent')}</Label>
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
              <Label>{t('partner.fields.status')}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, status: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue>{t(`partner.statuses.${form.status}` as never)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {t(`partner.statuses.${status.value}` as never)}
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
            label={t('partner.fields.primaryContact')}
            entityKind="contact"
            value={contactValue}
            selectionLabel={contactLabel}
            placeholder={t('partner.placeholders.contactSearch')}
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
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? tCommon('creating') : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
