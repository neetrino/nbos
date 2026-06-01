import { describe, expect, it } from 'vitest';
import { computeClientServicePaymentStage } from './client-service-payment-stage';

const NOW = new Date('2026-06-01T12:00:00.000Z');

describe('computeClientServicePaymentStage', () => {
  it('returns invoice for we-pay service near renewal', () => {
    const renewalDate = new Date('2026-07-01T00:00:00.000Z');

    const result = computeClientServicePaymentStage(
      {
        renewalDate,
        billingModel: 'WE_PAY',
        invoiceMoneyStatuses: [],
        expenseStatuses: [],
      },
      NOW,
    );

    expect(result.stage).toBe('invoice');
  });

  it('returns upcoming for reminder-only service near renewal', () => {
    const renewalDate = new Date('2026-07-01T00:00:00.000Z');

    const result = computeClientServicePaymentStage(
      {
        renewalDate,
        billingModel: 'REMINDER_ONLY',
        invoiceMoneyStatuses: [],
        expenseStatuses: [],
      },
      NOW,
    );

    expect(result.stage).toBe('upcoming');
  });

  it('returns pay_now for we-pay service with active expense', () => {
    const result = computeClientServicePaymentStage(
      {
        renewalDate: new Date('2027-01-01T00:00:00.000Z'),
        billingModel: 'WE_PAY',
        invoiceMoneyStatuses: [],
        expenseStatuses: ['DUE_NOW'],
      },
      NOW,
    );

    expect(result.stage).toBe('pay_now');
  });

  it('does not return pay_now for reminder-only service with no expense', () => {
    const renewalDate = new Date('2026-07-01T00:00:00.000Z');

    const result = computeClientServicePaymentStage(
      {
        renewalDate,
        billingModel: 'REMINDER_ONLY',
        invoiceMoneyStatuses: [],
        expenseStatuses: [],
      },
      NOW,
    );

    expect(result.stage).not.toBe('pay_now');
    expect(result.stage).not.toBe('invoice');
  });
});
