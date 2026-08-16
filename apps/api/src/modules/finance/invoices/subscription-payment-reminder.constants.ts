/** Asia/Yerevan calendar timezone for subscription payment reminder day math. */
export const SUBSCRIPTION_PAYMENT_REMINDER_TIMEZONE = 'Asia/Yerevan';

/**
 * Calendar days before Invoice.dueDate when client WhatsApp payment reminders fire.
 * Order is intentional (farther offset first); change here to adjust schedule later.
 */
export const SUBSCRIPTION_PAYMENT_REMINDER_DAYS_BEFORE_DUE = [10, 2] as const;

export type SubscriptionPaymentReminderOffsetDays =
  (typeof SUBSCRIPTION_PAYMENT_REMINDER_DAYS_BEFORE_DUE)[number];

export const SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES = {
  D10: 'finance.invoice.payment_reminder_d10',
  D2: 'finance.invoice.payment_reminder_d2',
} as const;

export function paymentReminderEventTypeForOffset(
  offsetDays: SubscriptionPaymentReminderOffsetDays,
): string {
  if (offsetDays === 10) return SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.D10;
  return SUBSCRIPTION_PAYMENT_REMINDER_EVENT_TYPES.D2;
}

export function buildSubscriptionPaymentReminderDedupeKey(
  invoiceId: string,
  offsetDays: number,
): string {
  return `subscription_payment_reminder:d${offsetDays}:${invoiceId}`;
}

export function buildSubscriptionPaymentReminderIdempotencyKey(
  invoiceId: string,
  offsetDays: number,
): string {
  return `subscription-payment-reminder:d${offsetDays}:${invoiceId}`;
}
