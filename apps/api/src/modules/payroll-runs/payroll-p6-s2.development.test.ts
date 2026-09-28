import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { assertBonusReleaseWithinEntryCap } from '../bonus/bonus-release-entry-cap';
import { remainingForBonusEntry } from './payroll-allocation-source-amounts';
import { resolveDraftAllocations } from './payroll-bonus-allocation-resolve';
import {
  P6_S2_DEV_DRAFT,
  P6_S2_DEV_EXTRA,
  P6_S2_DEV_EXTRA_WHEN_REMAINING_ZERO,
  P6_S2_DEV_ORDINARY_REMAINING,
  P6_S2_DEV_OVERFLOW_CELL,
  P6_S2_DEV_OVERFLOW_EXTRA,
  P6_S2_DEV_OVERFLOW_ORDINARY,
  P6_S2_DEV_PLAN,
  P6_S2_DEV_PLAN_AFTER_EXTRA,
  P6_S2_DEV_REJECTED_ORDINARY,
  P6_S2_DEV_RELEASE_1,
  P6_S2_DEV_RELEASE_2,
  P6_S2_DEV_RELEASE_3,
  P6_S2_DEV_REMAINING_WITH_DRAFT,
} from './payroll-p6-s2-expected.amounts';
import {
  createP6S2ResolveTx,
  p6S2ExtraDraft,
  p6S2PlanEntry,
  p6S2PlanRelease,
} from './payroll-p6-s2.development.fixture';

const PAYROLL_MONTH = '2026-05';
const CURRENT_RUN = 'pr-now';

describe('P6-S2 V-19 Development plan 200000 with extra 30000', () => {
  it('leaves ordinary remaining 30000 after 40000 then 10000 then 120000', () => {
    const remaining = remainingForBonusEntry({
      entry: p6S2PlanEntry(P6_S2_DEV_PLAN),
      releases: ordinaryInstallments(),
      payrollMonth: PAYROLL_MONTH,
      payrollRunId: CURRENT_RUN,
    });

    expect(remaining.toFixed(2)).toBe(P6_S2_DEV_ORDINARY_REMAINING.toFixed(2));
  });

  it('does not treat a 40000 draft as cash against the 30000 remaining', () => {
    const remaining = remainingForBonusEntry({
      entry: p6S2PlanEntry(P6_S2_DEV_PLAN),
      releases: [...ordinaryInstallments(), p6S2PlanRelease(CURRENT_RUN, P6_S2_DEV_DRAFT, 'DRAFT')],
      payrollMonth: PAYROLL_MONTH,
      payrollRunId: CURRENT_RUN,
    });

    expect(remaining.toFixed(2)).toBe(P6_S2_DEV_REMAINING_WITH_DRAFT.toFixed(2));
    expect(P6_S2_DEV_DRAFT.toFixed(2)).not.toBe(P6_S2_DEV_ORDINARY_REMAINING.toFixed(2));
  });

  it('rejects a further ordinary 40000 while 30000 remains', () => {
    expect(() =>
      assertBonusReleaseWithinEntryCap({
        entry: { type: 'DELIVERY', amount: P6_S2_DEV_PLAN, payableAmount: P6_S2_DEV_PLAN },
        priorCounting: P6_S2_DEV_PLAN.minus(P6_S2_DEV_ORDINARY_REMAINING),
        addAmount: P6_S2_DEV_REJECTED_ORDINARY,
        releaseType: 'MANUAL',
      }),
    ).toThrow(BadRequestException);
  });

  it('creates a separate extra 30000 only after remaining is 0', async () => {
    const entries = new Map([['be-plan', p6S2PlanEntry(P6_S2_DEV_PLAN)]]);
    const { tx } = createP6S2ResolveTx({
      entries,
      releases: [p6S2PlanRelease('pr-full', P6_S2_DEV_PLAN)],
    });

    const allocations = await resolveDraftAllocations(
      tx as never,
      p6S2ExtraDraft(P6_S2_DEV_EXTRA),
      { payrollRunId: CURRENT_RUN, payrollMonth: PAYROLL_MONTH },
      P6_S2_DEV_EXTRA,
    );
    const extra = allocations.find((row) => row.kind === 'EXTRA_BONUS');
    const planPart = allocations.find((row) => row.bonusEntryId === 'be-plan');

    expect(planPart).toBeUndefined();
    expect(extra?.amount.toFixed(2)).toBe(P6_S2_DEV_EXTRA_WHEN_REMAINING_ZERO.toFixed(2));
    expect(entries.get('be-plan')?.amount.toFixed(2)).toBe(P6_S2_DEV_PLAN_AFTER_EXTRA.toFixed(2));
    expect(entries.get('extra-1')?.amount.toFixed(2)).toBe(P6_S2_DEV_EXTRA.toFixed(2));
  });

  it('extras only the 30000 excess when the cell is 60000 above remaining 30000', async () => {
    const entries = new Map([['be-plan', p6S2PlanEntry(P6_S2_DEV_PLAN)]]);
    const { tx } = createP6S2ResolveTx({
      entries,
      releases: ordinaryInstallments(),
    });

    const allocations = await resolveDraftAllocations(
      tx as never,
      p6S2ExtraDraft(P6_S2_DEV_OVERFLOW_CELL),
      { payrollRunId: CURRENT_RUN, payrollMonth: PAYROLL_MONTH },
      P6_S2_DEV_OVERFLOW_CELL,
    );
    const planPart = allocations.find((row) => row.bonusEntryId === 'be-plan');
    const extra = allocations.find((row) => row.kind === 'EXTRA_BONUS');

    expect(planPart?.amount.toFixed(2)).toBe(P6_S2_DEV_OVERFLOW_ORDINARY.toFixed(2));
    expect(extra?.amount.toFixed(2)).toBe(P6_S2_DEV_OVERFLOW_EXTRA.toFixed(2));
    expect(entries.get('be-plan')?.amount.toFixed(2)).toBe(P6_S2_DEV_PLAN.toFixed(2));
    expect(entries.get('extra-1')?.amount.toFixed(2)).toBe(P6_S2_DEV_OVERFLOW_EXTRA.toFixed(2));
  });
});

function ordinaryInstallments() {
  return [
    p6S2PlanRelease('pr-1', P6_S2_DEV_RELEASE_1),
    p6S2PlanRelease('pr-2', P6_S2_DEV_RELEASE_2),
    p6S2PlanRelease('pr-3', P6_S2_DEV_RELEASE_3),
  ];
}
