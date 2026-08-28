import { clampBillingDayInMonth } from '../billing/subscription-billing-days';
import { CLIENT_PAYMENT_REMINDER_PAY_WITHIN_DAYS } from './subscription-payment-reminder.constants';
import {
  addCalendarDaysToKey,
  yerevanCalendarDateKey,
  yerevanCalendarDayStart,
} from './yerevan-calendar-date';

export interface SubscriptionPaymentWindowInput {
  /** Free: card createdAt. Tax: officialInvoiceSentAt (actual issue). */
  issuedOn: Date;
  dueDate: Date;
  coverageStartMonth: string | null;
  billingDay: number;
}

/** Yerevan pay/issue anchor: later of expected pay day and actual issue day. */
export function resolvePaymentWindowStartKey(input: SubscriptionPaymentWindowInput): string {
  const issuedKey = yerevanCalendarDateKey(input.issuedOn);
  const expectedKey = expectedPayKeyFromCoverage(input.coverageStartMonth, input.billingDay);
  if (expectedKey == null) return issuedKey;
  return expectedKey >= issuedKey ? expectedKey : issuedKey;
}

/**
 * True on the subscription pay day (or late issue day) and catch-up days
 * through min(dueDate, anchor + 5).
 */
export function isYerevanPaymentWindowOpen(
  asOf: Date,
  input: SubscriptionPaymentWindowInput,
): boolean {
  const asOfKey = yerevanCalendarDateKey(asOf);
  const dueKey = yerevanCalendarDateKey(input.dueDate);
  const startKey = resolvePaymentWindowStartKey(input);
  const graceEndKey = addCalendarDaysToKey(startKey, CLIENT_PAYMENT_REMINDER_PAY_WITHIN_DAYS);
  const endKey = dueKey < graceEndKey ? dueKey : graceEndKey;
  return asOfKey >= startKey && asOfKey <= endKey;
}

/** Open unpaid cards whose dueDate is still today or later (Yerevan). */
export function paymentWindowDueDateBounds(asOf: Date): { gte: Date } {
  return { gte: yerevanCalendarDayStart(yerevanCalendarDateKey(asOf)) };
}

function expectedPayKeyFromCoverage(
  coverageStartMonth: string | null,
  billingDay: number,
): string | null {
  if (coverageStartMonth == null || !/^\d{4}-\d{2}$/.test(coverageStartMonth)) return null;
  const year = Number(coverageStartMonth.slice(0, 4));
  const month = Number(coverageStartMonth.slice(5, 7));
  const day = clampBillingDayInMonth(year, month, billingDay);
  return `${coverageStartMonth}-${String(day).padStart(2, '0')}`;
}
