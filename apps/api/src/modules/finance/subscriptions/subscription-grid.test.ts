import { describe, it, expect } from 'vitest';
import { buildSubscriptionGridPayload, type SubscriptionGridRowInput } from './subscription-grid';

const NOW = new Date('2026-06-15T12:00:00.000Z');

function baseSub(overrides: Partial<SubscriptionGridRowInput> = {}): SubscriptionGridRowInput {
  return {
    id: 'sub-1',
    status: 'ACTIVE',
    amount: 80000,
    startDate: new Date('2026-01-01'),
    endDate: null,
    project: { id: 'p1', name: 'Alpha' },
    invoices: [],
    ...overrides,
  };
}

function subInvoice(
  id: string,
  opts: {
    start: string;
    count: number;
    paid: boolean;
    due?: Date | null;
  },
) {
  return {
    id,
    type: 'SUBSCRIPTION' as const,
    amount: 80000,
    dueDate: opts.due ?? null,
    coverageStartMonth: opts.start,
    coverageMonthCount: opts.count,
    createdAt: new Date('2026-04-01'),
    payments: opts.paid ? [{ amount: 80000 }] : [],
  };
}

describe('buildSubscriptionGridPayload', () => {
  it('marks paid months from coverage on fully paid invoices', () => {
    const payload = buildSubscriptionGridPayload(
      [
        baseSub({
          invoices: [subInvoice('i1', { start: '2026-03', count: 2, paid: true })],
        }),
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[2].kind).toBe('PAID');
    expect(payload.rows[0].months[3].kind).toBe('PAID');
    expect(payload.rows[0].months[2].invoiceId).toBe('i1');
    expect(payload.rows[0].annualTotal).toBe(720000);
  });

  it('marks overdue when due date passed and not fully paid', () => {
    const payload = buildSubscriptionGridPayload(
      [
        baseSub({
          invoices: [
            subInvoice('i1', {
              start: '2026-05',
              count: 1,
              paid: false,
              due: new Date('2026-05-10'),
            }),
          ],
        }),
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[4].kind).toBe('OVERDUE_INVOICE');
  });

  it('uses forecast for future active months without invoices', () => {
    const payload = buildSubscriptionGridPayload([baseSub()], 2026, NOW);
    expect(payload.rows[0].months[10].kind).toBe('FORECAST');
  });

  it('uses subscription pending styling for pending subscriptions', () => {
    const payload = buildSubscriptionGridPayload(
      [baseSub({ status: 'PENDING', invoices: [] })],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[0].kind).toBe('SUBSCRIPTION_PENDING');
  });

  it('aggregates month totals', () => {
    const payload = buildSubscriptionGridPayload(
      [baseSub(), baseSub({ id: 'sub-2', project: { id: 'p2', name: 'Beta' }, amount: 20000 })],
      2026,
      NOW,
    );
    expect(payload.monthTotals[10]).toBe(100000);
    expect(payload.grandAnnualTotal).toBeGreaterThan(0);
  });
});
