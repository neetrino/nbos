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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toDatetimeLocalValue } from './calendar-datetime-helpers';

const MEETING_TYPE_VALUES = [
  'SALES_CALL',
  'OFFER_PRESENTATION',
  'DEMO',
  'KICKOFF',
  'SUPPORT_CALL',
  'MAINTENANCE_CALL',
  'OTHER',
] as const;

const LOCATION_TYPE_VALUES = ['ONLINE', 'OFFLINE'] as const;

type MeetingTypeValue = (typeof MEETING_TYPE_VALUES)[number];
type LocationTypeValue = (typeof LOCATION_TYPE_VALUES)[number];

type MeetingCreateForm = {
  title: string;
  startsLocal: string;
  endsLocal: string;
  meetingType: MeetingTypeValue;
  locationType: LocationTypeValue;
  locationOrLink: string;
  agenda: string;
};

function isMeetingTypeValue(value: string | null): value is MeetingTypeValue {
  return value !== null && (MEETING_TYPE_VALUES as readonly string[]).includes(value);
}

function isLocationTypeValue(value: string | null): value is LocationTypeValue {
  return value !== null && (LOCATION_TYPE_VALUES as readonly string[]).includes(value);
}

function meetingDefaults(selectedDate: Date): MeetingCreateForm {
  return {
    title: '',
    startsLocal: toDatetimeLocalValue(selectedDate, 9, 0),
    endsLocal: toDatetimeLocalValue(selectedDate, 10, 0),
    meetingType: 'SALES_CALL',
    locationType: 'ONLINE',
    locationOrLink: '',
    agenda: '',
  };
}

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

  useEffect(() => {
    if (!open) return;
    setForm(meetingDefaults(selectedDate));
    setFormError(null);
    setConflicts(null);
    setOverrideReason('');
  }, [open, selectedDate]);

  useEffect(() => {
    setConflicts(null);
    setOverrideReason('');
  }, [form.startsLocal, form.endsLocal]);

  const submit = useCallback(async () => {
    const title = form.title.trim();
    if (!title) {
      setFormError(t('meeting.validation.titleRequired'));
      return;
    }
    const startsAt = new Date(form.startsLocal).toISOString();
    const endsAt = new Date(form.endsLocal).toISOString();
    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError(t('meeting.validation.endAfterStart'));
      return;
    }
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
  }, [conflicts, form, onCreated, onOpenChange, overrideReason, t, tCommon]);

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
            <div className="bg-secondary/60 space-y-2 rounded-xl border p-3 text-sm">
              <p className="text-foreground font-medium">{t('meeting.conflicts.title')}</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                {conflicts.map((c) => (
                  <li key={`${c.code}-${c.meetingId}`}>
                    <span className="text-foreground">{c.meetingTitle}</span>
                  </li>
                ))}
              </ul>
              <div>
                <Label htmlFor="cal-meet-override">{t('meeting.conflicts.overrideReason')}</Label>
                <Textarea
                  id="cal-meet-override"
                  className="mt-1.5"
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder={t('meeting.conflicts.overridePlaceholder')}
                />
              </div>
            </div>
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
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
            <div>
              <Label htmlFor="cal-meet-end">{t('meeting.fields.end')}</Label>
              <NbosDatePicker
                id="cal-meet-end"
                mode="datetime"
                variant="extended"
                className="mt-1.5"
                value={form.endsLocal}
                onChange={(endsLocal) => setForm((p) => ({ ...p, endsLocal }))}
                aria-label={t('meeting.fields.endAria')}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
              <Label>{t('meeting.fields.location')}</Label>
              <Select
                value={form.locationType}
                onValueChange={(v) => {
                  if (isLocationTypeValue(v)) setForm((p) => ({ ...p, locationType: v }));
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue>{t(`meeting.locationTypes.${form.locationType}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`meeting.locationTypes.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
