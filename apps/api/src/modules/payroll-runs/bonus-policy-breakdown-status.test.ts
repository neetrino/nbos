import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';

import {
  aggregateBonusBreakdownSummary,
  deriveBonusPolicyBreakdownStatuses,
} from './bonus-policy-breakdown-status';

describe('deriveBonusPolicyBreakdownStatuses', () => {
  it('tags incoming and clawback from entry status', () => {
    expect(deriveBonusPolicyBreakdownStatuses({ entryStatus: 'INCOMING' })).toEqual(['INCOMING']);
    expect(deriveBonusPolicyBreakdownStatuses({ entryStatus: 'CLAWBACK' })).toEqual(['CLAWBACK']);
  });

  it('tags burned and carry-over from persisted amounts', () => {
    expect(
      deriveBonusPolicyBreakdownStatuses({
        entryStatus: 'ACTIVE',
        kpiBurnedAmount: new Decimal(10),
        payrollCarryOverAmount: new Decimal(5),
      }),
    ).toEqual(['BURNED', 'CARRY_OVER']);
  });

  it('tags carry-over from pending prior-month balance', () => {
    expect(
      deriveBonusPolicyBreakdownStatuses({
        entryStatus: 'EARNED',
        pendingPayrollCarryOver: new Decimal(20),
      }),
    ).toEqual(['CARRY_OVER']);
  });
});

describe('aggregateBonusBreakdownSummary', () => {
  it('sums burned/carry and counts statuses', () => {
    const summary = aggregateBonusBreakdownSummary(
      [
        {
          entryStatus: 'INCOMING',
          kpiBurnedAmount: null,
          payrollCarryOverAmount: null,
        },
        {
          entryStatus: 'ACTIVE',
          kpiBurnedAmount: new Decimal(10),
          payrollCarryOverAmount: new Decimal(3),
        },
      ],
      new Decimal(7),
    );
    expect(summary.incomingCount).toBe(1);
    expect(summary.burnedTotal.toString()).toBe('10');
    expect(summary.carryOverTotal.toString()).toBe('10');
    expect(summary.clawbackCount).toBe(0);
  });
});
