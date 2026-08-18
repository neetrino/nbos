import { describe, expect, it } from 'vitest';
import { resolveInvoiceOverdueDays } from './invoice-overdue-days';
import type { Invoice } from '@/lib/api/finance';

function invoiceStub(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'inv-1',
    code: 'INV-1',
    amount: '100',
    moneyStatus: 'NEW',
    taxStatus: 'FREE',
    type: 'ONE_TIME',
    dueDate: null,
    paidDate: null,
    company: null,
    order: null,
    ...overrides,
  } as Invoice;
}

describe('resolveInvoiceOverdueDays', () => {
  it('returns 0 when paid or due date is missing', () => {
    expect(resolveInvoiceOverdueDays(invoiceStub({ moneyStatus: 'PAID' }))).toBe(0);
    expect(resolveInvoiceOverdueDays(invoiceStub({ dueDate: null }))).toBe(0);
  });

  it('returns whole days when due date is in the past', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    past.setHours(0, 0, 0, 0);
    const dueDate = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;

    expect(resolveInvoiceOverdueDays(invoiceStub({ dueDate, moneyStatus: 'OVERDUE' }))).toBe(3);
  });
});
