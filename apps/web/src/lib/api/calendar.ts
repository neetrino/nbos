import { api } from '../api';
import { isCalendarMeetingConflictApiError } from '../api-errors';

export type CalendarLayer = 'ALL' | 'MEETINGS' | 'DELIVERY_DEADLINES' | 'PERSONAL';

export interface CalendarEventProjection {
  id: string;
  layer: Exclude<CalendarLayer, 'ALL'>;
  title: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  description: string | null;
  status: string;
  sourceType: 'MEETING' | 'PRODUCT_DEADLINE' | 'EXTENSION_DEADLINE' | 'PERSONAL_EVENT';
  sourceId: string;
  sourceHref: string | null;
  badge: string;
  projectName: string | null;
  ownerName: string | null;
}

export interface CalendarEventsQuery {
  from: string;
  to: string;
  layer: CalendarLayer;
}

export interface CreateCalendarMeetingPayload {
  title: string;
  startsAt: string;
  endsAt: string;
  meetingType?: string;
  locationType?: string;
  locationOrLink?: string | null;
  agenda?: string | null;
  conflictOverrideReason?: string | null;
}

export interface CreatePersonalCalendarEventPayload {
  title: string;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
}

export interface CalendarMeetingConflictPayload {
  code: string;
  meetingId: string;
  meetingTitle: string;
  detail: string;
}

export function parseCalendarMeetingConflicts(
  error: unknown,
): CalendarMeetingConflictPayload[] | null {
  if (!isCalendarMeetingConflictApiError(error)) return null;
  const raw = error.details?.conflicts;
  if (!Array.isArray(raw)) return null;
  const out: CalendarMeetingConflictPayload[] = [];
  for (const item of raw) {
    if (isConflictPayload(item)) out.push(item);
  }
  return out.length > 0 ? out : null;
}

function isConflictPayload(v: unknown): v is CalendarMeetingConflictPayload {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { code: unknown }).code === 'string' &&
    typeof (v as { meetingId: unknown }).meetingId === 'string' &&
    typeof (v as { meetingTitle: unknown }).meetingTitle === 'string' &&
    typeof (v as { detail: unknown }).detail === 'string'
  );
}

export interface CalendarMeetingDetail {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  meetingType: string;
  locationType: string;
  locationOrLink: string | null;
  agenda: string | null;
  outcomeNotes: string | null;
  status: string;
  projectId: string | null;
  productId: string | null;
  dealId: string | null;
  contactId: string | null;
  createdById: string;
}

export interface CalendarPersonalEventDetail {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  notes: string | null;
  status: string;
}

export const calendarApi = {
  async listEvents(query: CalendarEventsQuery): Promise<CalendarEventProjection[]> {
    const resp = await api.get<CalendarEventProjection[]>('/api/calendar/events', {
      params: query,
    });
    return resp.data;
  },

  async createMeeting(body: CreateCalendarMeetingPayload): Promise<unknown> {
    const resp = await api.post('/api/calendar/meetings', body);
    return resp.data;
  },

  async createPersonalEvent(body: CreatePersonalCalendarEventPayload): Promise<unknown> {
    const resp = await api.post('/api/calendar/personal-events', body);
    return resp.data;
  },

  async getMeeting(id: string): Promise<CalendarMeetingDetail> {
    const resp = await api.get<CalendarMeetingDetail>(`/api/calendar/meetings/${id}`);
    return resp.data;
  },

  async getPersonalEvent(id: string): Promise<CalendarPersonalEventDetail> {
    const resp = await api.get<CalendarPersonalEventDetail>(`/api/calendar/personal-events/${id}`);
    return resp.data;
  },
};
