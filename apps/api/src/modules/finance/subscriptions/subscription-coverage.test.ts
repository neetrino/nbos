import { describe, it, expect } from 'vitest';
import { buildSubscriptionCoverageSummary } from './subscription-coverage';

function inv(paid: boolean, start: string, count: number) {
  return {
    type: 'SUBSCRIPTION' as const,
    amount: 1000,
    coverageStartMonth: start,
    coverageMonthCount: count,
    payments: paid ? [{ amount: 1000 }] : [{ amount: 400 }],
  };
}

describe('buildSubscriptionCoverageSummary', () => {
  it('counts distinct paid months in the rollup year', () => {
    const summary = buildSubscriptionCoverageSummary(
      { amount: 1000 },
      [inv(true, '2026-03', 2), inv(true, '2026-05', 1)],
      2026,
    );
    expect(summary.firstCoveredMonth).toBe(2);
    expect(summary.activeMonthCount).toBe(3);
    expect(summary.annualizedAmount).toBe(3000);
  });

  it('ignores unpaid and non-subscription invoices', () => {
    const summary = buildSubscriptionCoverageSummary(
      { amount: 500 },
      [
        inv(false, '2026-01', 3),
        {
          type: 'DEVELOPMENT',
          amount: 500,
          coverageStartMonth: '2026-01',
          coverageMonthCount: 12,
          payments: [{ amount: 500 }],
        },
      ],
      2026,
    );
    expect(summary.activeMonthCount).toBe(0);
  });

  it('handles yearly coverage spanning into the next year', () => {
    const summary = buildSubscriptionCoverageSummary(
      { amount: 100 },
      [inv(true, '2026-11', 4)],
      2026,
    );
    expect(summary.activeMonthCount).toBe(2);
    expect(summary.firstCoveredMonth).toBe(10);
  });
});
