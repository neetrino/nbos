import { describe, expect, it } from 'vitest';
import { resolveTermCompletion } from './billing-subscription-term-completion';

describe('resolveTermCompletion', () => {
  it('does not complete open-ended subscriptions', () => {
    const decision = resolveTermCompletion({
      termMonths: null,
      endDate: null,
      invoices: [
        {
          type: 'SUBSCRIPTION',
          coverageStartMonth: '2026-01',
          coverageMonthCount: 12,
          createdAt: new Date(2026, 0, 1),
        },
      ],
    });
    expect(decision.shouldComplete).toBe(false);
  });

  it('completes when covered months meet the term and stamps endDate', () => {
    const decision = resolveTermCompletion({
      termMonths: 6,
      endDate: null,
      invoices: [
        {
          type: 'SUBSCRIPTION',
          coverageStartMonth: '2026-01',
          coverageMonthCount: 6,
          createdAt: new Date(2026, 0, 1),
        },
      ],
    });
    expect(decision.shouldComplete).toBe(true);
    expect(decision.coveredMonths).toBe(6);
    expect(decision.endDate).toEqual(new Date(2026, 6, 0, 23, 59, 59, 999));
  });

  it('does not complete when covered months are still below the term', () => {
    const decision = resolveTermCompletion({
      termMonths: 6,
      endDate: null,
      invoices: [
        {
          type: 'SUBSCRIPTION',
          coverageStartMonth: '2026-01',
          coverageMonthCount: 3,
          createdAt: new Date(2026, 0, 1),
        },
      ],
    });
    expect(decision.shouldComplete).toBe(false);
  });
});
