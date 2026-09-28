import { describe, expect, it } from 'vitest';
import { buildProductDoneReadiness } from './product-done-readiness';

const readyWork = {
  clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
  extensions: [{ status: 'DONE' }],
  tasks: [{ status: 'DONE' }],
  tickets: [{ status: 'RESOLVED' }],
  project: {
    credentials: [{ category: 'HOSTING' }],
    domains: [{ status: 'ACTIVE' }],
    _count: { credentials: 1, domains: 1 },
  },
};

describe('buildProductDoneReadiness finance independence', () => {
  it('stays Done-ready when the linked order is partially paid and an invoice is unpaid', () => {
    const result = buildProductDoneReadiness({
      ...readyWork,
      order: {
        status: 'PARTIALLY_PAID',
        paymentType: 'CLASSIC',
        invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
      },
    });
    expect(result.canCompleteWithRuntimeData).toBe(true);
    expect(result.summary.unpaidInvoiceCount).toBe(1);
    expect(result.blockers.map((item) => item.code)).not.toContain('ORDER_NOT_CLOSED');
    expect(result.blockers.map((item) => item.code)).not.toContain('UNPAID_INVOICES');
  });
});
