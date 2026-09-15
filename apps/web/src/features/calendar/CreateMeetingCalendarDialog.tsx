'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  calendarApi,
  parseCalendarMeetingConflicts,
  type CalendarMeetingConflictPayload,
} from '@/lib/api/calendar';
import { firstReleaseFormErrorCopy, localizeCaughtApiError } from '@/i18n/localize-api-error';
import { CreateFormDialog } from '@/components/shared';
import { CreateMeetingCalendarDialogFields } from './CreateMeetingCalendarDialogFields';
import {
  DEFAULT_MEETING_DURATION_HOURS,
  endsAtIsoFromStartAndDuration,
  LOCATION_TYPE_VALUES,
  MEETING_TYPE_VALUES,
  meetingDefaults,
  parseDurationHours,
  type MeetingCreateForm,
} from './meeting-create-form';

export interface CreateMeetingCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onCreated: () => void;
}

export function CreateMeetingCalendarDialog(props: CreateMeetingCalendarDialogProps) {
  const sessionKey = props.open ? props.selectedDate.toISOString() : 'closed';
  return <CreateMeetingCalendarDialogSession key={sessionKey} {...props} />;
}

function CreateMeetingCalendarDialogSession({
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
  const meetingTypeOptions = useMemo(
    () => MEETING_TYPE_VALUES.map((value) => ({ value, label: t(`meeting.types.${value}`) })),
    [t],
  );
  const locationOptions = useMemo(
    () =>
      LOCATION_TYPE_VALUES.map((value) => ({ value, label: t(`meeting.locationTypes.${value}`) })),
    [t],
  );
  const canSubmit =
    Boolean(form.title.trim()) && !(conflicts?.length && !overrideReason.trim()) && !loading;

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('meeting.title')}
      error={formError}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel={conflicts?.length ? t('meeting.submit.scheduleAnyway') : tCommon('create')}
      submittingLabel={tCommon('saving')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) =>
        void submitMeeting({
          event,
          form,
          durationInput,
          conflicts,
          overrideReason,
          setLoading,
          setFormError,
          setConflicts,
          onOpenChange,
          onCreated,
          t,
          tCommon,
        })
      }
    >
      <CreateMeetingCalendarDialogFields
        form={form}
        durationInput={durationInput}
        conflicts={conflicts}
        overrideReason={overrideReason}
        meetingTypeOptions={meetingTypeOptions}
        locationOptions={locationOptions}
        onTitleChange={(title) => setForm((prev) => ({ ...prev, title }))}
        onStartsChange={(startsLocal) => {
          setConflicts(null);
          setOverrideReason('');
          setForm((prev) => ({ ...prev, startsLocal }));
        }}
        onDurationChange={(raw) => {
          const next = raw.replace(/\D/g, '').slice(0, 1);
          setDurationInput(next);
          setConflicts(null);
          setOverrideReason('');
          const parsed = parseDurationHours(next);
          if (parsed !== null) setForm((prev) => ({ ...prev, durationHours: parsed }));
        }}
        onMeetingTypeChange={(meetingType) => setForm((prev) => ({ ...prev, meetingType }))}
        onLocationTypeChange={(locationType) => setForm((prev) => ({ ...prev, locationType }))}
        onLocationOrLinkChange={(locationOrLink) =>
          setForm((prev) => ({ ...prev, locationOrLink }))
        }
        onAgendaChange={(agenda) => setForm((prev) => ({ ...prev, agenda }))}
        onOverrideReasonChange={setOverrideReason}
      />
    </CreateFormDialog>
  );
}

async function submitMeeting(options: {
  event: FormEvent;
  form: MeetingCreateForm;
  durationInput: string;
  conflicts: CalendarMeetingConflictPayload[] | null;
  overrideReason: string;
  setLoading: (loading: boolean) => void;
  setFormError: (error: string | null) => void;
  setConflicts: (conflicts: CalendarMeetingConflictPayload[] | null) => void;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}): Promise<void> {
  options.event.preventDefault();
  const title = options.form.title.trim();
  if (!title) {
    options.setFormError(options.t('meeting.validation.titleRequired'));
    return;
  }
  const durationHours = parseDurationHours(options.durationInput);
  if (durationHours === null) {
    options.setFormError(options.t('meeting.validation.durationRequired'));
    return;
  }
  options.setLoading(true);
  options.setFormError(null);
  try {
    await calendarApi.createMeeting({
      title,
      startsAt: new Date(options.form.startsLocal).toISOString(),
      endsAt: endsAtIsoFromStartAndDuration(options.form.startsLocal, durationHours),
      meetingType: options.form.meetingType,
      locationType: options.form.locationType,
      locationOrLink: options.form.locationOrLink.trim() || null,
      agenda: options.form.agenda.trim() || null,
      ...(options.conflicts?.length && options.overrideReason.trim()
        ? { conflictOverrideReason: options.overrideReason.trim() }
        : {}),
    });
    options.onOpenChange(false);
    options.onCreated();
  } catch (err) {
    const parsed = parseCalendarMeetingConflicts(err);
    if (parsed?.length) {
      options.setConflicts(parsed);
      options.setFormError(options.t('meeting.validation.overlapReason'));
      return;
    }
    options.setFormError(
      localizeCaughtApiError(
        err,
        firstReleaseFormErrorCopy(
          options.tCommon('permissionDenied'),
          options.t('meeting.createError'),
          options.t('errors.validation'),
          options.t('meeting.validation.overlapReason'),
          options.t('errors.network'),
        ),
      ),
    );
  } finally {
    options.setLoading(false);
  }
}
