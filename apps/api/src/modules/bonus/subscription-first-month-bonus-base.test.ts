import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { subscriptionFirstMonthBonusBase } from './subscription-first-month-bonus-base';

describe('subscriptionFirstMonthBonusBase', () => {
  it('keeps a one-month invoice amount', () => {
    expect(
      subscriptionFirstMonthBonusBase({
        invoiceAmount: new Decimal('100000.00'),
        coverageMonthCount: null,
        periodAmount: new Decimal('100000.00'),
      }).toFixed(2),
    ).toBe('100000.00');
  });

  it('uses one month when the first invoice prepays several monthly periods', () => {
    expect(
      subscriptionFirstMonthBonusBase({
        invoiceAmount: new Decimal('300000.00'),
        coverageMonthCount: null,
        periodAmount: new Decimal('100000.00'),
      }).toFixed(2),
    ).toBe('100000.00');
  });

  it('divides by stored coverage when the invoice already lists several months', () => {
    expect(
      subscriptionFirstMonthBonusBase({
        invoiceAmount: new Decimal('120000.00'),
        coverageMonthCount: 12,
        periodAmount: new Decimal('120000.00'),
      }).toFixed(2),
    ).toBe('10000.00');
  });

  it('keeps the invoice amount when coverage and period price do not prove extra months', () => {
    expect(
      subscriptionFirstMonthBonusBase({
        invoiceAmount: new Decimal('150000.00'),
        coverageMonthCount: null,
        periodAmount: null,
      }).toFixed(2),
    ).toBe('150000.00');
  });
});
