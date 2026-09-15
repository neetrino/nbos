'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { DetailSheetFieldSegmented } from '@/components/shared';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

  const locationOptions = LOCATION_TYPE_VALUES.map((value) => ({
    value,
    label: t(`meeting.locationTypes.${value}`),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
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

          <div>
            <Label htmlFor="cal-meet-title">{t('meeting.fields.title')}</Label>
            <Input
              id="cal-meet-title"
              className="mt-1.5"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder={t('meeting.fields.titlePlaceholder')}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="cal-meet-start">{t('meeting.fields.start')}</Label>
              <NbosDatePicker
                id="cal-meet-start"
                mode="datetime"
                variant="extended"
                className="mt-1.5"
                value={form.startsLocal}
                onChange={(startsLocal) => setForm((p) => ({ ...p, startsLocal }))}
                aria-label={t('meeting.fields.startAria')}
              />
            </div>
            <div className="w-full shrink-0 sm:w-24">
              <Label htmlFor="cal-meet-duration">{t('meeting.fields.duration')}</Label>
              <Input
                id="cal-meet-duration"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                className="mt-1.5"
                value={durationInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDurationInput(raw);
                  const parsed = parseDurationHours(raw);
                  if (parsed !== null) {
                    setForm((p) => ({ ...p, durationHours: parsed }));
                  }
                }}
                aria-label={t('meeting.fields.durationAria')}
              />
            </div>
            <div className="w-full shrink-0 sm:w-[11.5rem]">
              <Label>{t('meeting.fields.location')}</Label>
              <div className="mt-1.5">
                <DetailSheetFieldSegmented
                  label={t('meeting.fields.location')}
                  hideLabel
                  value={form.locationType}
                  options={locationOptions}
                  onValueChange={(locationType) => {
                    if (isLocationTypeValue(locationType)) {
                      setForm((p) => ({ ...p, locationType }));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>{t('meeting.fields.meetingType')}</Label>
            <Select
              value={form.meetingType}
              onValueChange={(v) => {
                if (isMeetingTypeValue(v)) setForm((p) => ({ ...p, meetingType: v }));
              }}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue>{t(`meeting.types.${form.meetingType}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`meeting.types.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cal-meet-link">{t('meeting.fields.linkOrAddress')}</Label>
            <Input
              id="cal-meet-link"
              className="mt-1.5"
              value={form.locationOrLink}
              onChange={(e) => setForm((p) => ({ ...p, locationOrLink: e.target.value }))}
              placeholder={t('meeting.fields.linkPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="cal-meet-agenda">{t('meeting.fields.agenda')}</Label>
            <Textarea
              id="cal-meet-agenda"
              className="mt-1.5"
              rows={2}
              value={form.agenda}
              onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))}
              placeholder={t('meeting.fields.agendaPlaceholder')}
            />
          </div>
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
