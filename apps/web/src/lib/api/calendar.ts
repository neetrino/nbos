import { api } from '../api';

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

export const calendarApi = {
  async listEvents(query: CalendarEventsQuery): Promise<CalendarEventProjection[]> {
    const resp = await api.get<CalendarEventProjection[]>('/api/calendar/events', {
      params: query,
    });
    return resp.data;
  },
};
