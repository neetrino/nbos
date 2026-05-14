import type { CalendarLayer } from '@/lib/api/calendar';

export const CALENDAR_DEFAULT_LAYER_STORAGE_KEY = 'nbos.calendar.defaultLayer';

/** Matches `apps/web/src/app/(app)/clients/contacts/page.tsx` open-sheet query. */
export const CLIENT_CONTACT_OPEN_QUERY = 'openId';

const ALLOWED_LAYERS: CalendarLayer[] = ['ALL', 'MEETINGS', 'DELIVERY_DEADLINES', 'PERSONAL'];

export function parseStoredCalendarLayer(raw: string | null): CalendarLayer | null {
  if (!raw) return null;
  return ALLOWED_LAYERS.includes(raw as CalendarLayer) ? (raw as CalendarLayer) : null;
}
