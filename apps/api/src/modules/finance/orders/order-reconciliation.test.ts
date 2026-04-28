import { describe, expect, it } from 'vitest';
import { buildOrderReconciliation } from './order-reconciliation';

describe('buildOrderReconciliation', () => {
  it('derives invoiced, paid, uninvoiced and outstanding order coverage', () => {
    const reconciliation = buildOrderReconciliation({
      totalAmount: 100000,
      invoices: [
        {
          amount: 60000,
          payments: [{ amount: 40000 }],
        },
        {
          amount: 20000,
          payments: [{ amount: 10000 }],
        },
      ],
      _count: { invoices: 2 },
    });

    expect(reconciliation).toEqual({
      orderAmount: 100000,
      invoicedAmount: 80000,
      paidAmount: 50000,
      uninvoicedAmount: 20000,
      outstandingAmount: 50000,
      invoiceCount: 2,
      isFullyInvoiced: false,
      isFullyPaid: false,
      warnings: [
        { code: 'UNINVOICED_AMOUNT', message: 'Order is not fully invoiced.' },
        { code: 'OUTSTANDING_AMOUNT', message: 'Order is not fully paid.' },
      ],
    });
  });

  it('reports missing invoice coverage without fake payment warnings', () => {
    const reconciliation = buildOrderReconciliation({
      totalAmount: 50000,
      invoices: [],
      _count: { invoices: 0 },
    });

    expect(reconciliation.warnings).toEqual([
      { code: 'NO_INVOICES', message: 'Order has no linked invoices yet.' },
    ]);
    expect(reconciliation.uninvoicedAmount).toBe(50000);
    expect(reconciliation.outstandingAmount).toBe(50000);
  });

  it('marks fully invoiced and fully paid orders as covered', () => {
    const reconciliation = buildOrderReconciliation({
      totalAmount: 50000,
      invoices: [{ amount: 50000, payments: [{ amount: 50000 }] }],
    });

    expect(reconciliation.isFullyInvoiced).toBe(true);
    expect(reconciliation.isFullyPaid).toBe(true);
    expect(reconciliation.warnings).toEqual([]);
  });
});
