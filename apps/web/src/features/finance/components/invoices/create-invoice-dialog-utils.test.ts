import { describe, expect, it } from 'vitest';
import type { Order } from '@/lib/api/finance';
import {
  buildCreateInvoicePayload,
  canSubmitCreateInvoice,
  getInitialInvoiceForm,
  getOrderOutstandingAmount,
} from './create-invoice-dialog-utils';

const order: Order = {
  id: 'ord-1',
  code: 'ORD-2026-0001',
  projectId: 'project-1',
  type: 'DEVELOPMENT',
  paymentType: 'PREPAYMENT',
  totalAmount: '120000',
  amount: '120000',
  paidAmount: 40000,
  currency: 'AMD',
  status: 'NEW',
  createdAt: '2026-04-01T00:00:00.000Z',
  project: { id: 'project-1', code: 'PRJ-1', name: 'Website' },
  company: { id: 'company-1', name: 'Client LLC' },
  contact: null,
  invoices: [],
  _count: { invoices: 0 },
};

describe('create invoice dialog utils', () => {
  it('pre-fills order scoped invoice amount from outstanding order coverage', () => {
    expect(getOrderOutstandingAmount(order)).toBe(80000);
    expect(getInitialInvoiceForm(order)).toEqual({
      projectId: 'project-1',
      amount: '80000',
      type: 'DEVELOPMENT',
      dueDate: '',
    });
  });

  it('builds a typed order-scoped create invoice payload', () => {
    const payload = buildCreateInvoicePayload(
      { projectId: 'ignored', amount: '80000', type: 'DEVELOPMENT', dueDate: '2026-04-30' },
      order,
    );

    expect(payload).toEqual({
      projectId: 'project-1',
      orderId: 'ord-1',
      companyId: 'company-1',
      amount: 80000,
      type: 'DEVELOPMENT',
      dueDate: '2026-04-30',
    });
  });

  it('requires project, type and positive amount before submit', () => {
    expect(
      canSubmitCreateInvoice({ projectId: 'p1', amount: '1', type: 'DEVELOPMENT', dueDate: '' }),
    ).toBe(true);
    expect(
      canSubmitCreateInvoice({ projectId: '', amount: '1', type: 'DEVELOPMENT', dueDate: '' }),
    ).toBe(false);
    expect(
      canSubmitCreateInvoice({ projectId: 'p1', amount: '0', type: 'DEVELOPMENT', dueDate: '' }),
    ).toBe(false);
  });
});
