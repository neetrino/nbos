import { describe, it, expect } from 'vitest';
import { buildSubscriptionGridPayload, type SubscriptionGridRowInput } from './subscription-grid';

const NOW = new Date('2026-06-15T12:00:00.000Z');

function baseSub(overrides: Partial<SubscriptionGridRowInput> = {}): SubscriptionGridRowInput {
  return {
    id: 'sub-1',
    name: 'Alpha Care',
    type: 'MAINTENANCE_ONLY',
    status: 'ACTIVE',
    amount: 80000,
    coverageMonthCount: 1,
    monthlyEquivalentAmount: 80000,
    billingStartDate: new Date('2026-01-01'),
    endDate: null,
    termMonths: null,
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
    amount?: number;
  },
) {
  const amount = opts.amount ?? 80000;
  return {
    id,
    type: 'SUBSCRIPTION' as const,
    amount,
    dueDate: opts.due ?? null,
    coverageStartMonth: opts.start,
    coverageMonthCount: opts.count,
    createdAt: new Date('2026-04-01'),
    payments: opts.paid ? [{ amount }] : [],
  };
}

describe('buildSubscriptionGridPayload', () => {
  it('paints a linked deal-deposit month as paid on the board', () => {
    const payload = buildSubscriptionGridPayload(
      [
        baseSub({
          billingStartDate: new Date(2026, 2, 15),
          invoices: [subInvoice('inv-deposit', { start: '2026-03', count: 1, paid: true })],
        }),
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[2].kind).toBe('PAID');
    expect(payload.rows[0].months[2].invoiceId).toBe('inv-deposit');
    expect(payload.rows[0].months[3].kind).not.toBe('PAID');
  });

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
    expect(payload.rows[0].months[2].displayAmount).toBe(80000);
    expect(payload.rows[0].months[3].displayAmount).toBeNull();
    // Mar charge 80k + Jun–Dec monthly forecast 7×80k (Apr is covered, not charged)
    expect(payload.rows[0].annualTotal).toBe(640000);
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
    expect(payload.rows[0].subscriptionName).toBe('Alpha Care');
    expect(payload.rows[0].projectName).toBe('Alpha');
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
      [
        baseSub(),
        baseSub({
          id: 'sub-2',
          project: { id: 'p2', name: 'Beta' },
          amount: 20000,
          coverageMonthCount: 1,
          monthlyEquivalentAmount: 20000,
        }),
      ],
      2026,
      NOW,
    );
    expect(payload.monthTotals[10]).toBe(100000);
    expect(payload.grandAnnualTotal).toBeGreaterThan(0);
  });

  it('bounds forecast by remaining term months after latest coverage', () => {
    const payload = buildSubscriptionGridPayload(
      [
        baseSub({
          termMonths: 6,
          invoices: [
            subInvoice('i1', { start: '2026-01', count: 1, paid: true }),
            subInvoice('i2', { start: '2026-02', count: 1, paid: true }),
            subInvoice('i3', { start: '2026-03', count: 1, paid: true }),
          ],
        }),
      ],
      2026,
      NOW,
    );
    // remaining = 3 → Jun, Jul, Aug forecast; Sep+ NA (missed Apr/May do not consume term)
    expect(payload.rows[0].months[3].kind).toBe('MISSED');
    expect(payload.rows[0].months[4].kind).toBe('MISSED');
    expect(payload.rows[0].months[5].kind).toBe('FORECAST');
    expect(payload.rows[0].months[6].kind).toBe('FORECAST');
    expect(payload.rows[0].months[7].kind).toBe('FORECAST');
    expect(payload.rows[0].months[8].kind).toBe('NA');
  });

  it('keeps an out-of-year live row visible with empty months', () => {
    const payload = buildSubscriptionGridPayload(
      [baseSub({ billingStartDate: new Date('2027-03-01'), status: 'ACTIVE' })],
      2026,
      NOW,
    );
    expect(payload.rows).toHaveLength(1);
    expect(payload.rows[0].months.every((cell) => cell.kind === 'NA')).toBe(true);
    expect(payload.rows[0].annualTotal).toBe(0);
  });

  it('keeps open-ended forecast unbounded by term', () => {
    const payload = buildSubscriptionGridPayload(
      [
        baseSub({
          termMonths: null,
          invoices: [subInvoice('i1', { start: '2026-01', count: 1, paid: true })],
        }),
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[10].kind).toBe('FORECAST');
  });

  it('keeps issued months on the invoice rate after the subscription amount changes', () => {
    const payload = buildSubscriptionGridPayload(
      [
        baseSub({
          amount: 100000,
          coverageMonthCount: 1,
          monthlyEquivalentAmount: 100000,
          invoices: [
            subInvoice('i-mar', { start: '2026-03', count: 1, paid: true, amount: 80000 }),
          ],
        }),
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[2].kind).toBe('PAID');
    expect(payload.rows[0].months[2].displayAmount).toBe(80000);
    expect(payload.rows[0].months[6].kind).toBe('FORECAST');
    expect(payload.rows[0].months[6].displayAmount).toBe(100000);
    expect(payload.monthTotals[2]).toBe(80000);
    expect(payload.monthTotals[6]).toBe(100000);
  });

  it('shows the yearly invoice amount only on the charge month', () => {
    const payload = buildSubscriptionGridPayload(
      [
        baseSub({
          amount: 144000,
          coverageMonthCount: 12,
          monthlyEquivalentAmount: 12000,
          invoices: [
            subInvoice('i-year', { start: '2026-01', count: 12, paid: true, amount: 120000 }),
          ],
        }),
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[0].kind).toBe('PAID');
    expect(payload.rows[0].months[0].displayAmount).toBe(120000);
    for (let month = 1; month < 12; month++) {
      expect(payload.rows[0].months[month].kind).toBe('PAID');
      expect(payload.rows[0].months[month].displayAmount).toBeNull();
    }
    expect(payload.rows[0].annualTotal).toBe(120000);
    expect(payload.monthTotals[0]).toBe(120000);
    expect(payload.monthTotals.slice(1).every((total) => total === 0)).toBe(true);
  });

  it('shows custom six-month amount only on cadence charge months', () => {
    const payload = buildSubscriptionGridPayload(
      [
        baseSub({
          amount: 40000,
          coverageMonthCount: 6,
          monthlyEquivalentAmount: 40000 / 6,
          invoices: [subInvoice('i-h1', { start: '2026-01', count: 6, paid: true, amount: 40000 })],
        }),
      ],
      2026,
      NOW,
    );
    expect(payload.rows[0].months[0].displayAmount).toBe(40000);
    expect(payload.rows[0].months[5].kind).toBe('PAID');
    expect(payload.rows[0].months[5].displayAmount).toBeNull();
    expect(payload.rows[0].months[6].kind).toBe('FORECAST');
    expect(payload.rows[0].months[6].displayAmount).toBe(40000);
    expect(payload.rows[0].months[7].displayAmount).toBeNull();
    expect(payload.rows[0].annualTotal).toBe(80000);
    expect(payload.monthTotals[0]).toBe(40000);
    expect(payload.monthTotals[6]).toBe(40000);
  });

  it('keeps monthly cells on the full period amount', () => {
    const payload = buildSubscriptionGridPayload([baseSub()], 2026, NOW);
    expect(payload.rows[0].months[0].kind).toBe('MISSED');
    expect(payload.rows[0].months[0].displayAmount).toBe(80000);
    expect(payload.rows[0].months[5].kind).toBe('FORECAST');
    expect(payload.rows[0].months[5].displayAmount).toBe(80000);
    expect(payload.rows[0].annualTotal).toBe(560000);
  });
});
