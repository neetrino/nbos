import { describe, expect, it } from 'vitest';
import { matchExpenseForPaidInvoice, resolveDomainExpenseAmount } from './domain-expense-cycle';

describe('domain expense cycle', () => {
  const paidAt = new Date('2026-09-01T00:00:00.000Z');

  it('reuses a unique open expense in the same window', () => {
    const match = matchExpenseForPaidInvoice({
      invoiceId: 'inv-2',
      paidAt,
      expenses: [
        {
          id: 'exp-1',
          sourceInvoiceId: null,
          dueDate: new Date('2026-09-15T00:00:00.000Z'),
          status: 'DUE_NOW',
        },
      ],
    });
    expect(match).toEqual({ kind: 'reuse', expenseId: 'exp-1' });
  });

  it('does not reuse a paid expense from last year', () => {
    const match = matchExpenseForPaidInvoice({
      invoiceId: 'inv-2',
      paidAt,
      expenses: [
        {
          id: 'exp-old',
          sourceInvoiceId: 'inv-old',
          dueDate: new Date('2025-09-01T00:00:00.000Z'),
          status: 'PAID',
        },
      ],
    });
    expect(match.kind).toBe('create');
  });

  it('asks for a manual link when several open expenses match', () => {
    const match = matchExpenseForPaidInvoice({
      invoiceId: 'inv-2',
      paidAt,
      expenses: [
        { id: 'a', sourceInvoiceId: null, dueDate: paidAt, status: 'PLANNED' },
        { id: 'b', sourceInvoiceId: null, dueDate: paidAt, status: 'DUE_NOW' },
      ],
    });
    expect(match.kind).toBe('ambiguous');
  });

  it('falls back to the invoice snapshot when provider cost is missing', () => {
    expect(resolveDomainExpenseAmount(null, '40')).toBe(40);
    expect(resolveDomainExpenseAmount('12', '40')).toBe(12);
  });
});
