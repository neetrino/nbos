'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { calendarApi } from '@/lib/api/calendar';
import { getApiErrorMessage } from '@/lib/api-errors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InlineField } from '@/components/shared';
import {
  DEFAULT_MEETING_DURATION_HOURS,
  endsAtIsoFromStartAndDuration,
  parseDurationHours,
} from '@/features/calendar/meeting-create-form';
import { toDatetimeLocalValue } from '@/features/calendar/calendar-datetime-helpers';

type PersonalCreateForm = {
  title: string;
  startsLocal: string;
  durationHours: number;
  notes: string;
};

function personalDefaults(selectedDate: Date): PersonalCreateForm {
  return {
    title: '',
    startsLocal: toDatetimeLocalValue(selectedDate, 9, 0),
    durationHours: DEFAULT_MEETING_DURATION_HOURS,
    notes: '',
  };
}

export interface CreatePersonalCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onCreated: () => void;
}

export function CreatePersonalCalendarDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreated,
}: CreatePersonalCalendarDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(() => personalDefaults(selectedDate));
  const [durationInput, setDurationInput] = useState(String(DEFAULT_MEETING_DURATION_HOURS));

  useEffect(() => {
    if (!open) return;
    const defaults = personalDefaults(selectedDate);
    setForm(defaults);
    setDurationInput(String(defaults.durationHours));
    setFormError(null);
  }, [open, selectedDate]);

  const submit = useCallback(async () => {
    const title = form.title.trim();
    if (!title) {
      setFormError(t('personal.validation.titleRequired'));
      return;
    }
    const durationHours = parseDurationHours(durationInput);
    if (durationHours === null) {
      setFormError(t('meeting.validation.durationRequired'));
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      await calendarApi.createPersonalEvent({
        title,
        startsAt: new Date(form.startsLocal).toISOString(),
        endsAt: endsAtIsoFromStartAndDuration(form.startsLocal, durationHours),
        notes: form.notes.trim() || null,
      });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setFormError(getApiErrorMessage(err, t('personal.createError')));
    } finally {
      setLoading(false);
    }
  }, [durationInput, form, onCreated, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('personal.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          <InlineField
            variant="controlled"
            label={t('personal.fields.title')}
            value={form.title}
            placeholder={t('personal.fields.titlePlaceholder')}
            onValueChange={(title) => setForm((p) => ({ ...p, title }))}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <InlineField
              variant="controlled"
              label={t('meeting.fields.start')}
              type="date"
              datePickerMode="datetime"
              datePickerVariant="extended"
              className="min-w-0 flex-1"
              value={form.startsLocal}
              onValueChange={(startsLocal) => setForm((p) => ({ ...p, startsLocal }))}
            />
            <InlineField
              variant="controlled"
              label={t('meeting.fields.duration')}
              type="text"
              className="w-16 shrink-0"
              value={durationInput}
              onValueChange={(raw) => {
                const next = raw.replace(/\D/g, '').slice(0, 1);
                setDurationInput(next);
                const parsed = parseDurationHours(next);
                if (parsed !== null) setForm((p) => ({ ...p, durationHours: parsed }));
              }}
            />
          </div>

          <InlineField
            variant="controlled"
            label={t('personal.fields.notes')}
            type="textarea"
            value={form.notes}
            placeholder={t('personal.fields.notesPlaceholder')}
            onValueChange={(notes) => setForm((p) => ({ ...p, notes }))}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={loading || !form.title.trim()}
          >
            {loading ? tCommon('saving') : tCommon('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
