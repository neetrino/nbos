import { describe, it, expect } from 'vitest';
import { resolveCompensationPayoutPhase } from './compensation-payout-phase';

describe('resolveCompensationPayoutPhase', () => {
  it('returns past_paid when salary line is PAID', () => {
    expect(
      resolveCompensationPayoutPhase({
        payrollMonth: '2026-01',
        runStatus: 'PAYING',
        lineStatus: 'PAID',
      }),
    ).toBe('past_paid');
  });

  it('returns active_payout for approved prior-month line', () => {
    expect(
      resolveCompensationPayoutPhase({
        payrollMonth: '2020-01',
        runStatus: 'APPROVED',
        lineStatus: 'APPROVED',
      }),
    ).toBe('active_payout');
  });

  it('returns accumulating for current or future month', () => {
    const future = '2099-12';
    expect(
      resolveCompensationPayoutPhase({
        payrollMonth: future,
        runStatus: 'DRAFT',
        lineStatus: 'PENDING',
      }),
    ).toBe('accumulating');
  });
});
