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

describe('buildProductDoneReadiness finance gate', () => {
  it('allows CLASSIC FULLY_PAID with no unpaid invoices', () => {
    const result = buildProductDoneReadiness({
      ...readyWork,
      order: {
        status: 'FULLY_PAID',
        paymentType: 'CLASSIC',
        invoices: [{ moneyStatus: 'PAID' }],
      },
    });
    expect(result.canCompleteWithRuntimeData).toBe(true);
    expect(result.blockers.map((item) => item.code)).not.toContain('ORDER_NOT_CLOSED');
    expect(result.blockers.map((item) => item.code)).not.toContain('UNPAID_INVOICES');
  });

  it('blocks CLASSIC PARTIALLY_PAID even when invoices are paid', () => {
    const result = buildProductDoneReadiness({
      ...readyWork,
      order: {
        status: 'PARTIALLY_PAID',
        paymentType: 'CLASSIC',
        invoices: [{ moneyStatus: 'PAID' }],
      },
    });
    expect(result.canCompleteWithRuntimeData).toBe(false);
    expect(result.blockers.map((item) => item.code)).toContain('ORDER_NOT_CLOSED');
  });

  it('mirrors TRANSFER: subscription PARTIALLY_PAID with no unpaid invoices is Done-ready', () => {
    const result = buildProductDoneReadiness({
      ...readyWork,
      order: {
        status: 'PARTIALLY_PAID',
        paymentType: 'SUBSCRIPTION',
        invoices: [{ moneyStatus: 'PAID' }],
      },
    });
    expect(result.canCompleteWithRuntimeData).toBe(true);
    expect(result.blockers.map((item) => item.code)).not.toContain('ORDER_NOT_CLOSED');
  });

  it('still blocks a subscription order that has an unpaid invoice', () => {
    const result = buildProductDoneReadiness({
      ...readyWork,
      order: {
        status: 'PARTIALLY_PAID',
        paymentType: 'SUBSCRIPTION',
        invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
      },
    });
    expect(result.canCompleteWithRuntimeData).toBe(false);
    expect(result.blockers.map((item) => item.code)).toContain('UNPAID_INVOICES');
    expect(result.blockers.map((item) => item.code)).not.toContain('ORDER_NOT_CLOSED');
  });
});
