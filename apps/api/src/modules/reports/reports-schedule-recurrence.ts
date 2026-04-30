import { BadRequestException } from '@nestjs/common';

export const REPORT_SCHEDULE_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export const DEFAULT_REPORT_SCHEDULE_TIMEZONE = 'Asia/Yerevan';
export const DEFAULT_REPORT_SCHEDULE_TIME_OF_DAY = '09:00';

export type ReportScheduleFrequency = (typeof REPORT_SCHEDULE_FREQUENCIES)[number];

export interface ReportScheduleRecurrence {
  frequency: ReportScheduleFrequency;
  timezone: string;
  timeOfDay: string;
  startDate: Date;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

const WEEK_SEARCH_DAYS = 14;
const MONTH_SEARCH_MONTHS = 24;

export function calculateNextReportScheduleRun(
  recurrence: ReportScheduleRecurrence,
  after: Date,
): Date {
  if (recurrence.frequency === 'DAILY') return nextDailyRun(recurrence, after);
  if (recurrence.frequency === 'WEEKLY') return nextWeeklyRun(recurrence, after);
  return nextMonthlyRun(recurrence, after);
}

export function assertReportScheduleRecurrence(recurrence: ReportScheduleRecurrence): void {
  if (!REPORT_SCHEDULE_FREQUENCIES.includes(recurrence.frequency)) {
    throw new BadRequestException('frequency must be DAILY, WEEKLY or MONTHLY.');
  }
  if (!/^\d{2}:\d{2}$/.test(recurrence.timeOfDay)) {
    throw new BadRequestException('timeOfDay must use HH:mm format.');
  }
  const [hours, minutes] = recurrence.timeOfDay.split(':').map(Number);
  if (hours > 23 || minutes > 59) throw new BadRequestException('timeOfDay is invalid.');
  if (recurrence.frequency === 'WEEKLY' && !isIntegerInRange(recurrence.dayOfWeek, 1, 7)) {
    throw new BadRequestException('dayOfWeek must be 1-7 for weekly schedules.');
  }
  if (recurrence.frequency === 'MONTHLY' && !isIntegerInRange(recurrence.dayOfMonth, 1, 28)) {
    throw new BadRequestException('dayOfMonth must be 1-28 for monthly schedules.');
  }
}

function nextDailyRun(recurrence: ReportScheduleRecurrence, after: Date): Date {
  const today = zonedParts(after, recurrence.timezone);
  let candidate = fromZonedParts(
    today.year,
    today.month,
    today.day,
    recurrence.timeOfDay,
    recurrence.timezone,
  );
  if (candidate <= after) {
    const nextDay = addUtcDays(candidate, 1);
    const parts = zonedParts(nextDay, recurrence.timezone);
    candidate = fromZonedParts(
      parts.year,
      parts.month,
      parts.day,
      recurrence.timeOfDay,
      recurrence.timezone,
    );
  }
  return candidate < recurrence.startDate ? recurrence.startDate : candidate;
}

function nextWeeklyRun(recurrence: ReportScheduleRecurrence, after: Date): Date {
  const target = recurrence.dayOfWeek ?? 1;
  for (let offset = 0; offset <= WEEK_SEARCH_DAYS; offset += 1) {
    const local = zonedParts(addUtcDays(after, offset), recurrence.timezone);
    if (local.weekday !== target) continue;
    const candidate = fromZonedParts(
      local.year,
      local.month,
      local.day,
      recurrence.timeOfDay,
      recurrence.timezone,
    );
    if (candidate > after && candidate >= recurrence.startDate) return candidate;
  }
  throw new BadRequestException('Could not calculate weekly report schedule.');
}

function nextMonthlyRun(recurrence: ReportScheduleRecurrence, after: Date): Date {
  const base = zonedParts(after, recurrence.timezone);
  const day = recurrence.dayOfMonth ?? 1;
  for (let offset = 0; offset <= MONTH_SEARCH_MONTHS; offset += 1) {
    const monthDate = new Date(Date.UTC(base.year, base.month - 1 + offset, 1));
    const candidate = fromZonedParts(
      monthDate.getUTCFullYear(),
      monthDate.getUTCMonth() + 1,
      day,
      recurrence.timeOfDay,
      recurrence.timezone,
    );
    if (candidate > after && candidate >= recurrence.startDate) return candidate;
  }
  throw new BadRequestException('Could not calculate monthly report schedule.');
}

function fromZonedParts(
  year: number,
  month: number,
  day: number,
  timeOfDay: string,
  timezone: string,
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const actual = zonedParts(guess, timezone);
  const desiredUtc = Date.UTC(year, month - 1, day, hours, minutes);
  const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
  return new Date(guess.getTime() + desiredUtc - actualUtc);
}

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '0';
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
    weekday: weekdayNumber(value('weekday')),
  };
}

function weekdayNumber(shortWeekday: string): number {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(shortWeekday) + 1;
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function isIntegerInRange(value: number | undefined, min: number, max: number): boolean {
  return value !== undefined && Number.isInteger(value) && value >= min && value <= max;
}
