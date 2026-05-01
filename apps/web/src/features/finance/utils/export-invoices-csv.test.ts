import { describe, expect, it } from 'vitest';
import { buildInvoicesCsvContent } from './export-invoices-csv';
import type { Invoice } from '@/lib/api/finance';

function minimalInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'inv-1',
    code: 'INV-001',
    orderId: null,
    subscriptionId: null,
    projectId: 'p1',
    companyId: null,
    amount: '100.00',
    currency: 'USD',
    taxStatus: 'TAX',
    type: 'STANDARD',
    status: 'DRAFT',
    dueDate: null,
    paidDate: null,
    govInvoiceId: null,
    description: null,
    createdAt: '2026-04-28T12:00:00.000Z',
    order: null,
    company: null,
    project: { id: 'p1', name: 'Alpha' },
    contact: null,
    payments: [],
    paymentCoverage: {
      paidAmount: 0,
      outstandingAmount: 100,
      paymentCount: 0,
      isFullyPaid: false,
    },
    _count: { payments: 0 },
    ...overrides,
  };
}

describe('buildInvoicesCsvContent', () => {
  it('header only when empty', () => {
    const csv = buildInvoicesCsvContent([]);
    expect(csv.split('\r\n')).toHaveLength(1);
    expect(csv).toContain('coveragePaidAmount');
  });

  it('escapes commas in description', () => {
    const csv = buildInvoicesCsvContent([
      minimalInvoice({ description: 'Line, one', code: 'INV-A' }),
    ]);
    expect(csv).toContain('"Line, one"');
  });

  it('appends grand total with summed amount and coverage', () => {
    const csv = buildInvoicesCsvContent([
      minimalInvoice({
        id: 'a',
        amount: '10.00',
        paymentCoverage: {
          paidAmount: 4,
          outstandingAmount: 6,
          paymentCount: 1,
          isFullyPaid: false,
        },
      }),
      minimalInvoice({
        id: 'b',
        code: 'INV-B',
        amount: '20.50',
        paymentCoverage: {
          paidAmount: 0.5,
          outstandingAmount: 20,
          paymentCount: 1,
          isFullyPaid: false,
        },
      }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain('_grand_total');
    expect(lines[3]).toContain('All invoices (2)');
    expect(lines[3]).toContain('30.50');
    expect(lines[3]).toContain('4.50');
    expect(lines[3]).toContain('26.00');
  });
});
