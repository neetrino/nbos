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

/** Cycle 0 keeps historical job keys so already-sent reminders are not resent. */
export const PAYMENT_REMINDER_CYCLE_INITIAL = 0;

export function buildSubscriptionPaymentReminderDedupeKey(
  invoiceId: string,
  offsetDays: number,
  cycle: number = PAYMENT_REMINDER_CYCLE_INITIAL,
): string {
  return withPaymentReminderCycleSuffix(
    `subscription_payment_reminder:d${offsetDays}:${invoiceId}`,
    cycle,
  );
}

export function buildSubscriptionPaymentReminderIdempotencyKey(
  invoiceId: string,
  offsetDays: number,
  cycle: number = PAYMENT_REMINDER_CYCLE_INITIAL,
): string {
  return withPaymentReminderCycleSuffix(
    `subscription-payment-reminder:d${offsetDays}:${invoiceId}`,
    cycle,
  );
}

function withPaymentReminderCycleSuffix(base: string, cycle: number): string {
  if (cycle <= PAYMENT_REMINDER_CYCLE_INITIAL) return base;
  return `${base}:c${cycle}`;
}
