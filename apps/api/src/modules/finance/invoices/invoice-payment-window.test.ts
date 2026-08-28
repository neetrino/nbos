import { describe, expect, it } from 'vitest';
import {
  isYerevanPaymentWindowOpen,
  resolvePaymentWindowStartKey,
  type SubscriptionPaymentWindowInput,
} from './invoice-payment-window';

function yerevanNoon(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T12:00:00+04:00`);
}

function windowInput(
  overrides: Partial<SubscriptionPaymentWindowInput> = {},
): SubscriptionPaymentWindowInput {
  return {
    createdAt: yerevanNoon('2026-04-01'),
    dueDate: yerevanNoon('2026-04-20'),
    coverageStartMonth: '2026-04',
    billingDay: 15,
    ...overrides,
  };
}

describe('resolvePaymentWindowStartKey', () => {
  it('uses billing_day when the card was created earlier on the 1st', () => {
    expect(resolvePaymentWindowStartKey(windowInput({ billingDay: 15 }))).toBe('2026-04-15');
  });

  it('uses the late issue day when we created the card after billing_day', () => {
    expect(
      resolvePaymentWindowStartKey(
        windowInput({
          billingDay: 10,
          createdAt: yerevanNoon('2026-04-14'),
          dueDate: yerevanNoon('2026-04-19'),
        }),
      ),
    ).toBe('2026-04-14');
  });

  it('uses 1 April for an early day-1 card created in March', () => {
    expect(
      resolvePaymentWindowStartKey(
        windowInput({
          billingDay: 1,
          createdAt: yerevanNoon('2026-03-30'),
          dueDate: yerevanNoon('2026-04-06'),
        }),
      ),
    ).toBe('2026-04-01');
  });
});

describe('isYerevanPaymentWindowOpen', () => {
  it('opens on the 15th, not the 1st, when the card was created on the 1st', () => {
    const input = windowInput();
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-01'), input)).toBe(false);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-15'), input)).toBe(true);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-20'), input)).toBe(true);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-21'), input)).toBe(false);
  });

  it('waits until the 1st for an early day-1 card', () => {
    const input = windowInput({
      billingDay: 1,
      createdAt: yerevanNoon('2026-03-30'),
      dueDate: yerevanNoon('2026-04-06'),
    });
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-03-30'), input)).toBe(false);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-01'), input)).toBe(true);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-06'), input)).toBe(true);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-07'), input)).toBe(false);
  });

  it('opens on the late issue day (pay 10, issued 14)', () => {
    const input = windowInput({
      billingDay: 10,
      createdAt: yerevanNoon('2026-04-14'),
      dueDate: yerevanNoon('2026-04-19'),
    });
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-10'), input)).toBe(false);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-14'), input)).toBe(true);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-16'), input)).toBe(true);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-20'), input)).toBe(false);
  });

  it('still opens on billing_day when dueDate is the old created+14 value', () => {
    const input = windowInput({
      billingDay: 10,
      createdAt: yerevanNoon('2026-04-10'),
      dueDate: yerevanNoon('2026-04-24'),
    });
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-10'), input)).toBe(true);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-15'), input)).toBe(true);
    expect(isYerevanPaymentWindowOpen(yerevanNoon('2026-04-16'), input)).toBe(false);
  });
});
