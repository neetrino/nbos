'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  calendarApi,
  parseCalendarMeetingConflicts,
  type CalendarMeetingConflictPayload,
} from '@/lib/api/calendar';
import { firstReleaseFormErrorCopy, localizeCaughtApiError } from '@/i18n/localize-api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { MeetingCreateConflicts } from './MeetingCreateConflicts';
import {
  DEFAULT_MEETING_DURATION_HOURS,
  endsAtIsoFromStartAndDuration,
  isLocationTypeValue,
  isMeetingTypeValue,
  LOCATION_TYPE_VALUES,
  MEETING_TYPE_VALUES,
  meetingDefaults,
  parseDurationHours,
} from './meeting-create-form';

export interface CreateMeetingCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onCreated: () => void;
}

export function CreateMeetingCalendarDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreated,
}: CreateMeetingCalendarDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<CalendarMeetingConflictPayload[] | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [form, setForm] = useState(() => meetingDefaults(selectedDate));
  const [durationInput, setDurationInput] = useState(String(DEFAULT_MEETING_DURATION_HOURS));

  useEffect(() => {
    if (!open) return;
    const defaults = meetingDefaults(selectedDate);
    setForm(defaults);
    setDurationInput(String(defaults.durationHours));
    setFormError(null);
    setConflicts(null);
    setOverrideReason('');
  }, [open, selectedDate]);

  useEffect(() => {
    setConflicts(null);
    setOverrideReason('');
  }, [form.startsLocal, form.durationHours]);

  const meetingTypeOptions = useMemo(
    () => MEETING_TYPE_VALUES.map((value) => ({ value, label: t(`meeting.types.${value}`) })),
    [t],
  );

  const locationOptions = useMemo(
    () =>
      LOCATION_TYPE_VALUES.map((value) => ({ value, label: t(`meeting.locationTypes.${value}`) })),
    [t],
  );

  const submit = useCallback(async () => {
    const title = form.title.trim();
    if (!title) {
      setFormError(t('meeting.validation.titleRequired'));
      return;
    }
    const durationHours = parseDurationHours(durationInput);
    if (durationHours === null) {
      setFormError(t('meeting.validation.durationRequired'));
      return;
    }
    const startsAt = new Date(form.startsLocal).toISOString();
    const endsAt = endsAtIsoFromStartAndDuration(form.startsLocal, durationHours);
    setLoading(true);
    setFormError(null);
    try {
      await calendarApi.createMeeting({
        title,
        startsAt,
        endsAt,
        meetingType: form.meetingType,
        locationType: form.locationType,
        locationOrLink: form.locationOrLink.trim() || null,
        agenda: form.agenda.trim() || null,
        ...(conflicts?.length && overrideReason.trim()
          ? { conflictOverrideReason: overrideReason.trim() }
          : {}),
      });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      const parsed = parseCalendarMeetingConflicts(err);
      if (parsed?.length) {
        setConflicts(parsed);
        setFormError(t('meeting.validation.overlapReason'));
        return;
      }
      setFormError(
        localizeCaughtApiError(
          err,
          firstReleaseFormErrorCopy(
            tCommon('permissionDenied'),
            t('meeting.createError'),
            t('errors.validation'),
            t('meeting.validation.overlapReason'),
            t('errors.network'),
          ),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [conflicts, durationInput, form, onCreated, onOpenChange, overrideReason, t, tCommon]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('meeting.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          {conflicts?.length ? (
            <MeetingCreateConflicts
              conflicts={conflicts}
              overrideReason={overrideReason}
              onOverrideReasonChange={setOverrideReason}
            />
          ) : null}

          <InlineField
            variant="controlled"
            label={t('meeting.fields.title')}
            value={form.title}
            placeholder={t('meeting.fields.titlePlaceholder')}
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
              className="w-24 shrink-0 [&_input]:text-center"
              value={durationInput}
              onValueChange={(raw) => {
                const next = raw.replace(/\D/g, '').slice(0, 1);
                setDurationInput(next);
                const parsed = parseDurationHours(next);
                if (parsed !== null) setForm((p) => ({ ...p, durationHours: parsed }));
              }}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <InlineField
              variant="controlled"
              label={t('meeting.fields.meetingType')}
              type="select"
              options={meetingTypeOptions}
              className="min-w-0 flex-1"
              value={form.meetingType}
              onValueChange={(v) => {
                if (isMeetingTypeValue(v)) setForm((p) => ({ ...p, meetingType: v }));
              }}
            />
            <DetailSheetFieldSegmented
              label={t('meeting.fields.location')}
              className="w-full shrink-0 sm:w-[11.5rem]"
              value={form.locationType}
              options={locationOptions}
              onValueChange={(locationType) => {
                if (isLocationTypeValue(locationType)) {
                  setForm((p) => ({ ...p, locationType }));
                }
              }}
            />
          </div>

          <InlineField
            variant="controlled"
            label={t('meeting.fields.linkOrAddress')}
            value={form.locationOrLink}
            placeholder={t('meeting.fields.linkPlaceholder')}
            onValueChange={(locationOrLink) => setForm((p) => ({ ...p, locationOrLink }))}
          />

          <InlineField
            variant="controlled"
            label={t('meeting.fields.agenda')}
            type="textarea"
            value={form.agenda}
            placeholder={t('meeting.fields.agendaPlaceholder')}
            onValueChange={(agenda) => setForm((p) => ({ ...p, agenda }))}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={
              loading || Boolean(conflicts?.length && !overrideReason.trim()) || !form.title.trim()
            }
          >
            {loading
              ? tCommon('saving')
              : conflicts?.length
                ? t('meeting.submit.scheduleAnyway')
                : tCommon('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
