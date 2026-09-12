import {
  DESK_LINE_AUTUMN_START_MONTH,
  DESK_LINE_EPOCH_DAY,
  DESK_LINE_EPOCH_MONTH,
  DESK_LINE_EPOCH_YEAR,
  DESK_LINE_LEAP_DAY,
  DESK_LINE_LEAP_MONTH,
  DESK_LINE_LEAP_OBSERVED_DAY,
  DESK_LINE_MEMORIAL_MONTH_DAY,
  DESK_LINE_MS_PER_DAY,
  DESK_LINE_SPRING_START_MONTH,
  DESK_LINE_SUMMER_START_MONTH,
  DESK_LINE_TIMEZONE,
  DESK_LINE_WINTER_START_MONTH,
  DESK_LINE_YEREVAN_OFFSET_HOURS,
} from './desk-line.constants';
import type {
  DeskLineCalendarDay,
  DeskLineCalendarEvent,
  DeskLineSeason,
} from './desk-line.types';

const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/u;
const YEREVAN_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: DESK_LINE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Curated calendar only. Sources checked 2026-09-12:
 * - 01-01 / 12-31: civil New Year.
 * - 04-23: UNESCO World Book and Copyright Day (28 C/Resolution 3.18, 23 April).
 *   https://www.unesco.org/en/days/world-book-and-copyright
 * - 04-24: Armenian Genocide Remembrance Day (memorial tone filter, not a celebration).
 * - 09-21: Independence Day of the Republic of Armenia (does not imply a day off).
 * - 10-01: International Music Day, International Music Council, first marked 1 October 1975.
 *   https://imc-cim.org/international-music-day/
 * Not included: 8 March, religious Christmas, Army Day, Victory Day — gender, faith, or
 * political tone could not be made safe for the whole audience.
 */
export const DESK_LINE_EVENTS: readonly DeskLineCalendarEvent[] = [
  { id: 'new-year', monthDay: '01-01', kind: 'celebration', source: 'Civil New Year, 1 January' },
  {
    id: 'world-book-day',
    monthDay: '04-23',
    kind: 'cultural',
    source: 'UNESCO World Book and Copyright Day, 23 April',
  },
  {
    id: 'armenia-remembrance',
    monthDay: DESK_LINE_MEMORIAL_MONTH_DAY,
    kind: 'memorial',
    source: 'Armenian Genocide Remembrance Day, 24 April',
  },
  {
    id: 'armenia-independence',
    monthDay: '09-21',
    kind: 'celebration',
    source: 'Independence Day of the Republic of Armenia, 21 September',
  },
  {
    id: 'international-music-day',
    monthDay: '10-01',
    kind: 'cultural',
    source: 'International Music Day, IMC, 1 October',
  },
  {
    id: 'new-year-eve',
    monthDay: '12-31',
    kind: 'celebration',
    source: 'New Year’s Eve, 31 December',
  },
];

export function yerevanCalendarDay(now: Date): DeskLineCalendarDay {
  const parts = Object.fromEntries(
    YEREVAN_DATE_FORMATTER.formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const monthDay = `${pad2(month)}-${pad2(day)}`;
  return {
    year,
    month,
    day,
    monthDay,
    dateKey: `${year}-${monthDay}`,
    dayOrdinal: calendarDayOrdinal({ year, month, day }),
  };
}

export function parseValidCalendarDate(value?: string | null): CalendarDateParts | null {
  const match = value?.trim().match(ISO_DATE_PREFIX);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isRealUtcDate(year, month, day)) return null;
  return { year, month, day };
}

export function isRealUtcDate(year: number, month: number, day: number): boolean {
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}

export function monthDayMatches(source: CalendarDateParts, today: DeskLineCalendarDay): boolean {
  if (source.month === today.month && source.day === today.day) return true;
  return (
    source.month === DESK_LINE_LEAP_MONTH &&
    source.day === DESK_LINE_LEAP_DAY &&
    today.month === DESK_LINE_LEAP_MONTH &&
    today.day === DESK_LINE_LEAP_OBSERVED_DAY &&
    !isLeapYear(today.year)
  );
}

export function calendarDaysBetween(from: CalendarDateParts, today: DeskLineCalendarDay): number {
  const start = Date.UTC(from.year, from.month - 1, from.day);
  const end = Date.UTC(today.year, today.month - 1, today.day);
  return Math.floor((end - start) / DESK_LINE_MS_PER_DAY);
}

export function calendarDayOrdinal(date: CalendarDateParts): number {
  const start = Date.UTC(DESK_LINE_EPOCH_YEAR, DESK_LINE_EPOCH_MONTH - 1, DESK_LINE_EPOCH_DAY);
  const end = Date.UTC(date.year, date.month - 1, date.day);
  return Math.floor((end - start) / DESK_LINE_MS_PER_DAY);
}

export function deskLineSeason(month: number): DeskLineSeason {
  if (month >= DESK_LINE_SPRING_START_MONTH && month < DESK_LINE_SUMMER_START_MONTH) {
    return 'spring';
  }
  if (month >= DESK_LINE_SUMMER_START_MONTH && month < DESK_LINE_AUTUMN_START_MONTH) {
    return 'summer';
  }
  if (month >= DESK_LINE_AUTUMN_START_MONTH && month < DESK_LINE_WINTER_START_MONTH) {
    return 'autumn';
  }
  return 'winter';
}

export function isMemorialDay(monthDay: string): boolean {
  return monthDay === DESK_LINE_MEMORIAL_MONTH_DAY;
}

export function eventOnMonthDay(monthDay: string): DeskLineCalendarEvent | null {
  return DESK_LINE_EVENTS.find((event) => event.monthDay === monthDay && event.kind !== 'memorial') ??
    null;
}

/** Next 00:00 in Asia/Yerevan. Yerevan is UTC+4 without DST. */
export function nextYerevanMidnightUtc(now: Date): Date {
  const today = yerevanCalendarDay(now);
  return new Date(
    Date.UTC(today.year, today.month - 1, today.day, 24 - DESK_LINE_YEREVAN_OFFSET_HOURS, 0, 0, 0),
  );
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
