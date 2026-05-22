import { describe, it, expect } from 'vitest';
import { Decimal } from '@nbos/database';

import { createMockPrisma } from '../../test-utils/mock-prisma';

import {
  parsePayrollMonthToUtcRange,
  sumPaymentsBySellerForPayrollMonthSuggestedSalesKpi,
  sumPaymentsForPayrollMonthSuggestedSalesKpi,
} from './payroll-run-suggested-sales-actual';

describe('parsePayrollMonthToUtcRange', () => {
  it('returns UTC half-open interval for valid payroll month', () => {
    expect(parsePayrollMonthToUtcRange('2026-02')).toEqual({
      gte: new Date(Date.UTC(2026, 1, 1, 0, 0, 0, 0)),
      lt: new Date(Date.UTC(2026, 2, 1, 0, 0, 0, 0)),
    });
  });

  it('returns null when month key is invalid', () => {
    expect(parsePayrollMonthToUtcRange('2026-13')).toBeNull();
    expect(parsePayrollMonthToUtcRange('not-a-month')).toBeNull();
  });
});

describe('sumPaymentsForPayrollMonthSuggestedSalesKpi', () => {
  it('aggregates payments in calendar month (UTC)', async () => {
    const prisma = createMockPrisma();
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal('1234.56') } });

    const sum = await sumPaymentsForPayrollMonthSuggestedSalesKpi(prisma as never, '2026-01');

    expect(sum.toFixed(2)).toBe('1234.56');
    expect(prisma.payment.aggregate).toHaveBeenCalledWith({
      where: {
        paymentDate: {
          gte: new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0)),
          lt: new Date(Date.UTC(2026, 1, 1, 0, 0, 0, 0)),
        },
      },
      _sum: { amount: true },
    });
  });

  it('returns zero and skips aggregate for invalid month', async () => {
    const prisma = createMockPrisma();
    const sum = await sumPaymentsForPayrollMonthSuggestedSalesKpi(prisma as never, '2026-99');
    expect(sum.toFixed(2)).toBe('0.00');
    expect(prisma.payment.aggregate).not.toHaveBeenCalled();
  });
});

describe('sumPaymentsBySellerForPayrollMonthSuggestedSalesKpi', () => {
  it('sums payments by deal seller in payroll month', async () => {
    const prisma = createMockPrisma();
    prisma.payment.findMany.mockResolvedValue([
      {
        amount: new Decimal('100'),
        invoice: { order: { deal: { sellerId: 'e1' } } },
      },
      {
        amount: new Decimal('50'),
        invoice: { order: { deal: { sellerId: 'e1' } } },
      },
      {
        amount: new Decimal('25'),
        invoice: { order: { deal: { sellerId: 'e2' } } },
      },
    ]);

    const totals = await sumPaymentsBySellerForPayrollMonthSuggestedSalesKpi(
      prisma as never,
      '2026-03',
      ['e1', 'e2'],
    );

    expect(totals.get('e1')?.toFixed(2)).toBe('150.00');
    expect(totals.get('e2')?.toFixed(2)).toBe('25.00');
    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          paymentDate: {
            gte: new Date(Date.UTC(2026, 2, 1, 0, 0, 0, 0)),
            lt: new Date(Date.UTC(2026, 3, 1, 0, 0, 0, 0)),
          },
        }),
      }),
    );
  });

  it('returns zero map for empty seller list', async () => {
    const prisma = createMockPrisma();
    const totals = await sumPaymentsBySellerForPayrollMonthSuggestedSalesKpi(
      prisma as never,
      '2026-03',
      [],
    );
    expect(totals.size).toBe(0);
    expect(prisma.payment.findMany).not.toHaveBeenCalled();
  });
});
