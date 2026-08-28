import { describe, expect, it } from 'vitest';
import {
  buildPaymentWindowReminderDedupeKey,
  buildSubscriptionPaymentReminderDedupeKey,
  buildSubscriptionPaymentReminderIdempotencyKey,
  PAYMENT_REMINDER_CYCLE_INITIAL,
} from './subscription-payment-reminder.constants';

describe('subscription payment reminder keys', () => {
  it('keeps historical keys on the initial cycle so On Hold cannot resend', () => {
    expect(buildSubscriptionPaymentReminderDedupeKey('inv-1', 10)).toBe(
      'subscription_payment_reminder:d10:inv-1',
    );
    expect(buildSubscriptionPaymentReminderIdempotencyKey('inv-1', 2)).toBe(
      'subscription-payment-reminder:d2:inv-1',
    );
    expect(
      buildSubscriptionPaymentReminderDedupeKey('inv-1', 10, PAYMENT_REMINDER_CYCLE_INITIAL),
    ).toBe('subscription_payment_reminder:d10:inv-1');
  });

  it('uses a window key for the pay-day letter, separate from historical D-10 / D-2', () => {
    expect(buildPaymentWindowReminderDedupeKey('inv-1')).toBe(
      'subscription_payment_reminder:window:inv-1',
    );
    expect(buildPaymentWindowReminderDedupeKey('inv-1', 1)).toBe(
      'subscription_payment_reminder:window:inv-1:c1',
    );
  });

  it('uses a new key after Cancelled so Awaiting Payment can send again', () => {
    expect(buildSubscriptionPaymentReminderDedupeKey('inv-1', 10, 1)).toBe(
      'subscription_payment_reminder:d10:inv-1:c1',
    );
    expect(buildSubscriptionPaymentReminderIdempotencyKey('inv-1', 2, 1)).toBe(
      'subscription-payment-reminder:d2:inv-1:c1',
    );
  });
});
