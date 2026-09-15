import { toDatetimeLocalValue } from './calendar-datetime-helpers';

/** Create-form meeting directions (legacy enum values remain for existing rows). */
export const MEETING_TYPE_VALUES = ['SALES_CALL', 'HR', 'DEVELOPMENT', 'OTHER'] as const;

export const LOCATION_TYPE_VALUES = ['ONLINE', 'OFFLINE'] as const;

export const DEFAULT_MEETING_DURATION_HOURS = 1;
export const MAX_MEETING_DURATION_HOURS = 3;

const MS_PER_HOUR = 60 * 60 * 1000;

export type MeetingTypeValue = (typeof MEETING_TYPE_VALUES)[number];
export type LocationTypeValue = (typeof LOCATION_TYPE_VALUES)[number];

export type MeetingCreateForm = {
  title: string;
  startsLocal: string;
  durationHours: number;
  meetingType: MeetingTypeValue;
  locationType: LocationTypeValue;
  locationOrLink: string;
  agenda: string;
};

export function isMeetingTypeValue(value: string | null): value is MeetingTypeValue {
  return value !== null && (MEETING_TYPE_VALUES as readonly string[]).includes(value);
}

export function isLocationTypeValue(value: string | null): value is LocationTypeValue {
  return value !== null && (LOCATION_TYPE_VALUES as readonly string[]).includes(value);
}

export function meetingDefaults(selectedDate: Date): MeetingCreateForm {
  return {
    title: '',
    startsLocal: toDatetimeLocalValue(selectedDate, 9, 0),
    durationHours: DEFAULT_MEETING_DURATION_HOURS,
    meetingType: 'SALES_CALL',
    locationType: 'OFFLINE',
    locationOrLink: '',
    agenda: '',
  };
}

export function parseDurationHours(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_MEETING_DURATION_HOURS) {
    return null;
  }
  return parsed;
}

export function endsAtIsoFromStartAndDuration(startsLocal: string, durationHours: number): string {
  const startMs = new Date(startsLocal).getTime();
  return new Date(startMs + durationHours * MS_PER_HOUR).toISOString();
}
