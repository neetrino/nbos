import {
  addCalendarDaysToKey,
  yerevanCalendarDateKey,
  yerevanCalendarDayStart,
} from './yerevan-calendar-date';

/** Calendar days after the pay/issue anchor before the invoice is overdue. */
export const SUBSCRIPTION_INVOICE_GRACE_CALENDAR_DAYS = 5;

/**
 * Last on-time day is `max(expected pay day, issue day) + 5` calendar days (Yerevan).
 */
export function resolveSubscriptionInvoiceDueDate(args: {
  expectedPayDate: Date;
  issuedOn: Date;
}): Date {
  const expectedKey = yerevanCalendarDateKey(args.expectedPayDate);
  const issuedKey = yerevanCalendarDateKey(args.issuedOn);
  const anchorKey = expectedKey >= issuedKey ? expectedKey : issuedKey;
  const dueKey = addCalendarDaysToKey(anchorKey, SUBSCRIPTION_INVOICE_GRACE_CALENDAR_DAYS);
  return yerevanCalendarDayStart(dueKey);
}
