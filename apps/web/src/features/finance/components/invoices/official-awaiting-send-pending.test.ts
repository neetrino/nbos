import { describe, expect, it } from 'vitest';
import { shouldMarkOfficialAwaitingSendPending } from './official-awaiting-send-pending';
import type { Invoice } from '@/lib/api/finance';

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    code: 'INV-1',
    orderId: null,
    subscriptionId: null,
    projectId: null,
    productId: null,
    companyId: 'c1',
    amount: '1000',
    currency: 'AMD',
    taxStatus: 'TAX',
    type: 'MANUAL',
    moneyStatus: 'NEW',
    dueDate: null,
    paidDate: null,
    govInvoiceId: null,
    officialInvoiceRequestSent: false,
    officialInvoiceSentAt: null,
    officialInvoiceCancelledAt: null,
    notificationsEnabled: true,
    orderComment: null,
    description: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    order: null,
    company: { id: 'c1', name: 'InvestOn', legalName: 'InvestOn LLC', taxId: '01234567' },
    product: null,
    project: null,
    contact: null,
    payments: [],
    _count: { payments: 0 },
    ...overrides,
  };
}

describe('shouldMarkOfficialAwaitingSendPending', () => {
  it('marks Tax cards entering Awaiting Payment', () => {
    expect(shouldMarkOfficialAwaitingSendPending(invoice(), 'AWAITING_PAYMENT')).toBe(true);
  });

  it('skips already sent and non-Awaiting targets', () => {
    expect(
      shouldMarkOfficialAwaitingSendPending(
        invoice({ officialInvoiceRequestSent: true }),
        'AWAITING_PAYMENT',
      ),
    ).toBe(false);
    expect(shouldMarkOfficialAwaitingSendPending(invoice(), 'OVERDUE')).toBe(false);
  });
});
