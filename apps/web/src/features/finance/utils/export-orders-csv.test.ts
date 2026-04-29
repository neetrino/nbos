import { describe, expect, it } from 'vitest';
import { buildOrdersCsvContent } from './export-orders-csv';
import type { Order } from '@/lib/api/finance';

function minimalOrder(overrides: Partial<Order>): Order {
  return {
    id: 'o1',
    code: 'ORD-1',
    projectId: 'p1',
    type: 'SALE',
    paymentType: 'ONE_TIME',
    totalAmount: '100.00',
    currency: 'USD',
    status: 'OPEN',
    createdAt: '2026-04-28T12:00:00.000Z',
    project: { id: 'p1', code: 'P', name: 'Alpha' },
    company: null,
    contact: null,
    invoices: [],
    reconciliation: {
      orderAmount: 100,
      invoicedAmount: 40,
      paidAmount: 10,
      uninvoicedAmount: 60,
      outstandingAmount: 30,
      invoiceCount: 1,
      isFullyInvoiced: false,
      isFullyPaid: false,
      warnings: [],
    },
    ...overrides,
  };
}

describe('buildOrdersCsvContent', () => {
  it('header only when empty', () => {
    const csv = buildOrdersCsvContent([]);
    expect(csv.split('\r\n')).toHaveLength(1);
    expect(csv).toContain('totalAmount');
  });

  it('escapes company name with comma', () => {
    const csv = buildOrdersCsvContent([minimalOrder({ company: { id: 'c1', name: 'Acme, LLC' } })]);
    expect(csv).toContain('"Acme, LLC"');
  });

  it('appends grand total for amount and reconciliation roll-ups', () => {
    const csv = buildOrdersCsvContent([
      minimalOrder({
        id: 'a',
        totalAmount: '10.00',
        reconciliation: {
          orderAmount: 10,
          invoicedAmount: 4,
          paidAmount: 1,
          uninvoicedAmount: 6,
          outstandingAmount: 3,
          invoiceCount: 1,
          isFullyInvoiced: false,
          isFullyPaid: false,
          warnings: [],
        },
      }),
      minimalOrder({
        id: 'b',
        code: 'ORD-2',
        totalAmount: '20.50',
        reconciliation: {
          orderAmount: 20.5,
          invoicedAmount: 20.5,
          paidAmount: 5,
          uninvoicedAmount: 0,
          outstandingAmount: 15.5,
          invoiceCount: 2,
          isFullyInvoiced: true,
          isFullyPaid: false,
          warnings: [],
        },
      }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain('_grand_total');
    expect(lines[3]).toContain('All orders (2)');
    expect(lines[3]).toContain('30.50');
    expect(lines[3]).toContain('24.50');
    expect(lines[3]).toContain('6.00');
    expect(lines[3]).toContain('18.50');
  });
});
