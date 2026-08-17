import { BadRequestException } from '@nestjs/common';

export const RECURRENCE_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
export const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export interface RecurringScheduleSnapshot {
  frequency: string;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  dueDateOffset: number | null;
  daysOfWeek: string[];
  dayOfMonth: number | null;
}

export interface RecurringScheduleInput {
  frequency?: string;
  interval?: number;
  startDate?: string;
  endDate?: string | null;
  dueDateOffset?: number | null;
  daysOfWeek?: string[];
  dayOfMonth?: number;
}

export function computeNextCreateAt(
  frequency: string,
  interval: number,
  startDate: Date,
  daysOfWeek: string[],
  dayOfMonth?: number,
  endDate?: Date | null,
  now: Date = new Date(),
): Date | null {
  if (endDate && endDate < startDate) return null;

  let next = new Date(startDate);
  if (frequency === 'MONTHLY' && dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, daysInMonth));
  }
  while (next <= now) {
    next = advanceOccurrence(next, frequency, interval, daysOfWeek, dayOfMonth);
    if (endDate && next > endDate) return null;
  }
  if (endDate && next > endDate) return null;
  return next;
}

export function advanceOccurrence(
  baseDate: Date,
  frequency: string,
  interval: number,
  daysOfWeek: string[],
  dayOfMonth?: number,
): Date {
  const next = new Date(baseDate);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + interval);
      return next;
    case 'WEEKLY':
      return advanceWeekly(next, interval, daysOfWeek);
    case 'MONTHLY':
      return advanceMonthly(next, interval, dayOfMonth);
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval);
      return next;
    default:
      next.setDate(next.getDate() + interval);
      return next;
  }
}

export function assertRecurringInput(
  data: RecurringScheduleInput,
  existing?: RecurringScheduleSnapshot,
): void {
  assertFrequency(data.frequency ?? existing?.frequency);
  assertInterval(data.interval ?? existing?.interval ?? 1);
  assertDueDateOffset(data.dueDateOffset ?? existing?.dueDateOffset ?? null);
  const startDate = resolveStartDate(data, existing);
  const endDate = resolveEndDate(data, existing);
  if (endDate && endDate < startDate) {
    throw new BadRequestException('endDate cannot be earlier than startDate.');
  }
  assertWeeklyDays(data.frequency ?? existing?.frequency, data.daysOfWeek ?? existing?.daysOfWeek);
  assertMonthlyDay(data.frequency ?? existing?.frequency, data.dayOfMonth ?? existing?.dayOfMonth);
}

function advanceWeekly(baseDate: Date, interval: number, daysOfWeek: string[]): Date {
  if (daysOfWeek.length === 0) {
    const next = new Date(baseDate);
    next.setDate(next.getDate() + 7 * interval);
    return next;
  }

  const normalized = [...daysOfWeek].map((day) => weekdayCodeToIndex(day)).sort((a, b) => a - b);
  const currentIndex = weekdayCodeToIndex(dateToWeekdayCode(baseDate));
  const sameOrNext = normalized.find((index) => index > currentIndex);

  if (sameOrNext !== undefined) {
    const next = new Date(baseDate);
    next.setDate(next.getDate() + (sameOrNext - currentIndex));
    return next;
  }

  const next = new Date(baseDate);
  const firstInCycle = normalized[0] ?? 0;
  next.setDate(next.getDate() + 7 * interval - currentIndex + firstInCycle);
  return next;
}

function advanceMonthly(baseDate: Date, interval: number, dayOfMonth?: number): Date {
  const targetDay =
    dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31 ? dayOfMonth : baseDate.getDate();
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + interval, 1);
  const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(targetDay, daysInMonth));
  return next;
}

function weekdayCodeToIndex(code: string): number {
  switch (code) {
    case 'MO':
      return 1;
    case 'TU':
      return 2;
    case 'WE':
      return 3;
    case 'TH':
      return 4;
    case 'FR':
      return 5;
    case 'SA':
      return 6;
    case 'SU':
      return 0;
    default:
      return 0;
  }
}

function dateToWeekdayCode(date: Date): string {
  return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][date.getDay()] ?? 'SU';
}

function assertFrequency(frequency: string | undefined): void {
  if (
    frequency &&
    !RECURRENCE_FREQUENCIES.includes(frequency as (typeof RECURRENCE_FREQUENCIES)[number])
  ) {
    throw new BadRequestException('frequency must be DAILY, WEEKLY, MONTHLY, or YEARLY.');
  }
}

function assertInterval(interval: number): void {
  if (!Number.isInteger(interval) || interval < 1) {
    throw new BadRequestException('interval must be an integer >= 1.');
  }
}

function assertDueDateOffset(dueDateOffset: number | null): void {
  if (dueDateOffset !== null && (!Number.isInteger(dueDateOffset) || dueDateOffset < 0)) {
    throw new BadRequestException('dueDateOffset must be an integer >= 0.');
  }
}

function resolveStartDate(
  data: RecurringScheduleInput,
  existing?: RecurringScheduleSnapshot,
): Date {
  const startDate = data.startDate ? new Date(data.startDate) : existing?.startDate;
  if (!startDate || Number.isNaN(startDate.getTime())) {
    throw new BadRequestException('startDate is required and must be a valid ISO date.');
  }
  return startDate;
}

function resolveEndDate(
  data: RecurringScheduleInput,
  existing?: RecurringScheduleSnapshot,
): Date | null {
  const endDate =
    data.endDate !== undefined
      ? data.endDate
        ? new Date(data.endDate)
        : null
      : (existing?.endDate ?? null);
  if (endDate && Number.isNaN(endDate.getTime())) {
    throw new BadRequestException('endDate must be a valid ISO date.');
  }
  return endDate;
}

function assertWeeklyDays(frequency: string | undefined, daysOfWeek: string[] | undefined): void {
  if ((frequency ?? '') !== 'WEEKLY') return;
  for (const day of daysOfWeek ?? []) {
    if (!WEEKDAY_CODES.includes(day as (typeof WEEKDAY_CODES)[number])) {
      throw new BadRequestException('daysOfWeek must use weekday codes: MO,TU,WE,TH,FR,SA,SU.');
    }
  }
}

function assertMonthlyDay(
  frequency: string | undefined,
  dayOfMonth: number | null | undefined,
): void {
  if ((frequency ?? '') !== 'MONTHLY' || dayOfMonth == null) return;
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new BadRequestException('dayOfMonth must be an integer between 1 and 31.');
  }
}
