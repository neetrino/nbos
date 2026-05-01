import { describe, expect, it } from 'vitest';
import { buildFinanceReconciliationSummary } from './finance-reconciliation-summary';

describe('buildFinanceReconciliationSummary', () => {
  it('derives order coverage and warnings from invoices and payments', () => {
    const result = buildFinanceReconciliationSummary([
      {
        totalAmount: 100000,
        invoices: [
          {
            amount: 80000,
            payments: [{ amount: 50000 }],
          },
        ],
      },
      {
        totalAmount: 40000,
        invoices: [
          {
            amount: 40000,
            payments: [{ amount: 40000 }],
          },
        ],
      },
    ]);

    expect(result).toEqual({
      orderCount: 2,
      orderAmount: 140000,
      invoicedAmount: 120000,
      paidAmount: 90000,
      uninvoicedAmount: 20000,
      outstandingAmount: 50000,
      fullyInvoicedCount: 1,
      fullyPaidCount: 1,
      warnings: [
        {
          code: 'UNINVOICED_ORDERS',
          count: 1,
          message: 'Orders still have uninvoiced amounts.',
        },
        {
          code: 'OUTSTANDING_ORDERS',
          count: 1,
          message: 'Orders still have outstanding payment amounts.',
        },
      ],
    });
  });

  it('omits warnings when every order is invoiced and paid', () => {
    const result = buildFinanceReconciliationSummary([
      {
        totalAmount: 25000,
        invoices: [
          {
            amount: 25000,
            payments: [{ amount: 25000 }],
          },
        ],
      },
    ]);

    expect(result.warnings).toEqual([]);
    expect(result.uninvoicedAmount).toBe(0);
    expect(result.outstandingAmount).toBe(0);
  });
});
