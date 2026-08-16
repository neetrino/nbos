import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import {
  DEPOSIT_PERIOD_AMOUNT_TOLERANCE,
  INVOICE_MONEY_DECIMAL_PLACES,
  ROUTE_A_PERIOD_COVERAGE_MONTH_COUNT,
  formatUnlinkedDepositAmountWarning,
  resolveDepositCoverageMonthCount,
} from './deal-subscription-deposit-coverage';

const PERIOD = new Decimal('1000000.00');

describe('resolveDepositCoverageMonthCount', () => {
  it('maps one period price to one period of coverage', () => {
    expect(
      resolveDepositCoverageMonthCount({
        invoiceAmount: PERIOD,
        periodAmount: PERIOD,
        periodCoverageMonthCount: ROUTE_A_PERIOD_COVERAGE_MONTH_COUNT,
      }),
    ).toBe(1);
  });

  it('maps an exact two-period deposit to two coverage months', () => {
    expect(
      resolveDepositCoverageMonthCount({
        invoiceAmount: new Decimal('2000000.00'),
        periodAmount: PERIOD,
        periodCoverageMonthCount: ROUTE_A_PERIOD_COVERAGE_MONTH_COUNT,
      }),
    ).toBe(2);
  });

  it('uses subscription coverageMonthCount for a single period on yearly billing', () => {
    expect(
      resolveDepositCoverageMonthCount({
        invoiceAmount: new Decimal('120000.00'),
        periodAmount: new Decimal('120000.00'),
        periodCoverageMonthCount: 12,
      }),
    ).toBe(12);
  });

  it('rejects a partial deposit that is not a whole number of periods', () => {
    expect(
      resolveDepositCoverageMonthCount({
        invoiceAmount: new Decimal('400000.00'),
        periodAmount: PERIOD,
        periodCoverageMonthCount: 1,
      }),
    ).toBeNull();
  });

  it('rejects a one-cent shortfall at Decimal(12, 2) scale', () => {
    expect(
      resolveDepositCoverageMonthCount({
        invoiceAmount: new Decimal('999999.99'),
        periodAmount: PERIOD,
        periodCoverageMonthCount: 1,
      }),
    ).toBeNull();
  });

  it('accepts number and string operands after quantizing to stored money scale', () => {
    expect(
      resolveDepositCoverageMonthCount({
        invoiceAmount: '1000000.00',
        periodAmount: 1_000_000,
        periodCoverageMonthCount: 1,
      }),
    ).toBe(1);
  });

  it('rejects a zero or negative period price', () => {
    expect(
      resolveDepositCoverageMonthCount({
        invoiceAmount: PERIOD,
        periodAmount: new Decimal(0),
        periodCoverageMonthCount: 1,
      }),
    ).toBeNull();
  });
});

describe('deposit amount comparison constants', () => {
  it('quantizes to Prisma Decimal(12, 2) and allows no remainder', () => {
    expect(INVOICE_MONEY_DECIMAL_PLACES).toBe(2);
    expect(DEPOSIT_PERIOD_AMOUNT_TOLERANCE.isZero()).toBe(true);
  });
});

describe('formatUnlinkedDepositAmountWarning', () => {
  it('names the deal, invoice, and both amounts', () => {
    const message = formatUnlinkedDepositAmountWarning(
      'D-2026-0001',
      'INV-2026-0001',
      new Decimal('400000.00'),
      PERIOD,
    );
    expect(message).toContain('D-2026-0001');
    expect(message).toContain('INV-2026-0001');
    expect(message).toContain('400000.00');
    expect(message).toContain('1000000.00');
    expect(message).toContain('leaving unlinked');
  });
});
