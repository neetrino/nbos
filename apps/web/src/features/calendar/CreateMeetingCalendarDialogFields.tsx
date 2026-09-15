'use client';

import { useTranslations } from 'next-intl';
import { DetailSheetFieldSegmented, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import type { CalendarMeetingConflictPayload } from '@/lib/api/calendar';
import { MeetingCreateConflicts } from './MeetingCreateConflicts';
import {
  isLocationTypeValue,
  isMeetingTypeValue,
  type LocationTypeValue,
  type MeetingCreateForm,
  type MeetingTypeValue,
} from './meeting-create-form';

interface CreateMeetingCalendarDialogFieldsProps {
  form: MeetingCreateForm;
  durationInput: string;
  conflicts: CalendarMeetingConflictPayload[] | null;
  overrideReason: string;
  meetingTypeOptions: Array<{ value: string; label: string }>;
  locationOptions: Array<{ value: string; label: string }>;
  onTitleChange: (title: string) => void;
  onStartsChange: (startsLocal: string) => void;
  onDurationChange: (raw: string) => void;
  onMeetingTypeChange: (value: MeetingTypeValue) => void;
  onLocationTypeChange: (value: LocationTypeValue) => void;
  onLocationOrLinkChange: (value: string) => void;
  onAgendaChange: (value: string) => void;
  onOverrideReasonChange: (value: string) => void;
}

export function CreateMeetingCalendarDialogFields({
  form,
  durationInput,
  conflicts,
  overrideReason,
  meetingTypeOptions,
  locationOptions,
  onTitleChange,
  onStartsChange,
  onDurationChange,
  onMeetingTypeChange,
  onLocationTypeChange,
  onLocationOrLinkChange,
  onAgendaChange,
  onOverrideReasonChange,
}: CreateMeetingCalendarDialogFieldsProps) {
  const t = useTranslations('forms');
  return (
    <>
      {conflicts?.length ? (
        <MeetingCreateConflicts
          conflicts={conflicts}
          overrideReason={overrideReason}
          onOverrideReasonChange={onOverrideReasonChange}
        />
      ) : null}
      <InlineField
        variant="controlled"
        label={t('meeting.fields.title')}
        value={form.title}
        placeholder={t('meeting.fields.titlePlaceholder')}
        onValueChange={onTitleChange}
      />
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('meeting.fields.start')}
          type="date"
          datePickerMode="datetime"
          datePickerVariant="extended"
          className={FORM_FIELD_CELL_CLASS}
          value={form.startsLocal}
          onValueChange={onStartsChange}
        />
        <InlineField
          variant="controlled"
          label={t('meeting.fields.duration')}
          type="text"
          className={FORM_FIELD_CELL_CLASS}
          value={durationInput}
          onValueChange={onDurationChange}
        />
      </FormFieldRow>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('meeting.fields.meetingType')}
          type="select"
          options={meetingTypeOptions}
          className={FORM_FIELD_CELL_CLASS}
          value={form.meetingType}
          onValueChange={(value) => {
            if (isMeetingTypeValue(value)) onMeetingTypeChange(value);
          }}
        />
        <DetailSheetFieldSegmented
          label={t('meeting.fields.location')}
          className={FORM_FIELD_CELL_CLASS}
          value={form.locationType}
          options={locationOptions}
          onValueChange={(locationType) => {
            if (isLocationTypeValue(locationType)) onLocationTypeChange(locationType);
          }}
        />
      </FormFieldRow>
      <InlineField
        variant="controlled"
        label={t('meeting.fields.linkOrAddress')}
        value={form.locationOrLink}
        placeholder={t('meeting.fields.linkPlaceholder')}
        onValueChange={onLocationOrLinkChange}
      />
      <InlineField
        variant="controlled"
        label={t('meeting.fields.agenda')}
        type="textarea"
        value={form.agenda}
        placeholder={t('meeting.fields.agendaPlaceholder')}
        onValueChange={onAgendaChange}
      />
    </>
  );
}
