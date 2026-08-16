import { SUBSCRIPTION_PAYMENT_REMINDER_TIMEZONE } from './subscription-payment-reminder.constants';

const YEREVAN_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: SUBSCRIPTION_PAYMENT_REMINDER_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Returns YYYY-MM-DD for the instant in Asia/Yerevan (not raw UTC midnight). */
export function yerevanCalendarDateKey(date: Date): string {
  return YEREVAN_DATE_FORMATTER.format(date);
}

/** Add calendar days to a YYYY-MM-DD key (pure date arithmetic, no TZ shift). */
export function addCalendarDaysToKey(yyyyMmDd: string, days: number): string {
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

/**
 * True when Yerevan calendar day of `asOf` equals Yerevan calendar day of `dueDate` minus `offsetDays`.
 * No catch-up: only exact day match.
 */
export function isYerevanDueOffsetDay(asOf: Date, dueDate: Date, offsetDays: number): boolean {
  const asOfKey = yerevanCalendarDateKey(asOf);
  const dueKey = yerevanCalendarDateKey(dueDate);
  return asOfKey === addCalendarDaysToKey(dueKey, -offsetDays);
}

/** Inclusive UTC bounds covering Yerevan calendar days from `asOf` through `asOf + maxOffsetDays`. */
export function yerevanDueDateWindowForOffsets(
  asOf: Date,
  maxOffsetDays: number,
): { gte: Date; lte: Date } {
  const asOfKey = yerevanCalendarDateKey(asOf);
  const farKey = addCalendarDaysToKey(asOfKey, maxOffsetDays);
  return {
    gte: yerevanDayStartUtc(asOfKey),
    lte: yerevanDayEndUtc(farKey),
  };
}

function yerevanDayStartUtc(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00+04:00`);
}

function yerevanDayEndUtc(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T23:59:59.999+04:00`);
}
