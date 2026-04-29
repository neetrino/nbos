import { describe, expect, it } from 'vitest';
import { buildPaymentsCsvContent } from './export-payments-csv';
import type { Payment } from '@/lib/api/finance';

function minimalPayment(overrides: Partial<Payment>): Payment {
  return {
    id: 'pay-1',
    invoiceId: 'inv-1',
    amount: '100.00',
    paymentDate: '2026-04-15',
    paymentMethod: 'BANK',
    confirmedBy: null,
    notes: null,
    createdAt: '2026-04-28T12:00:00.000Z',
    invoice: { id: 'inv-1', code: 'INV-1', projectId: 'p1', type: 'STANDARD' },
    project: { id: 'p1', name: 'Alpha' },
    company: { id: 'c1', name: 'Acme' },
    confirmer: null,
    ...overrides,
  };
}

describe('buildPaymentsCsvContent', () => {
  it('header only when empty', () => {
    const csv = buildPaymentsCsvContent([]);
    expect(csv.split('\r\n')).toHaveLength(1);
    expect(csv).toContain('invoiceCode');
  });

  it('escapes notes with newline', () => {
    const csv = buildPaymentsCsvContent([minimalPayment({ notes: 'A\nB' })]);
    expect(csv).toContain('"A\nB"');
  });

  it('appends grand total amount', () => {
    const csv = buildPaymentsCsvContent([
      minimalPayment({ id: 'a', amount: '10.00' }),
      minimalPayment({
        id: 'b',
        amount: '20.50',
        invoiceId: 'inv-2',
        invoice: { id: 'inv-2', code: 'INV-2', projectId: 'p1', type: 'STANDARD' },
      }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain('_grand_total');
    expect(lines[3]).toContain('All payments (2)');
    expect(lines[3]).toContain('30.50');
  });
});
