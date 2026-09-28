import { describe, expect, it } from 'vitest';

import { computeExpenseLedgerPaymentStatus } from '../expenses/expense-payment-rollup';
import {
  allocateSalaryFirstCash,
  parsePayrollCashBonusAssignments,
  summarizeBonusCashBalances,
} from './payroll-salary-first-cash';
import {
  P6_S2_BONUS_REMAINING,
  P6_S2_CASH,
  P6_S2_EXPENSE_FULLY_PAID,
  P6_S2_EXPENSE_REMAINING,
  P6_S2_EXPENSE_TOTAL,
  P6_S2_INCLUDED_BONUS,
  P6_S2_NAMED_BONUS_PAID,
  P6_S2_SALARY_PAID,
  P6_S2_SALARY_REMAINING,
  P6_S2_SALARY_REMAINING_AFTER,
} from './payroll-p6-s2-expected.amounts';

const BONUS_RELEASE_ID = 'rel-60';

describe('P6-S2 V-19 salary-first cash 320000 of 300000 plus 60000', () => {
  it('pays 300000 salary plus named bonus 20000 and leaves bonus 40000', () => {
    const bonuses = [{ bonusReleaseId: BONUS_RELEASE_ID, remaining: P6_S2_INCLUDED_BONUS }];
    const allocation = allocateSalaryFirstCash({
      cash: P6_S2_CASH,
      salaryRemaining: P6_S2_SALARY_REMAINING,
      bonuses,
      assignments: parsePayrollCashBonusAssignments([
        { bonusReleaseId: BONUS_RELEASE_ID, amount: P6_S2_NAMED_BONUS_PAID.toFixed(2) },
      ]),
    });
    const [bonus] = summarizeBonusCashBalances(bonuses, allocation.bonusParts);
    const paid = allocation.salaryAmount.plus(allocation.bonusCash);
    const expenseStatus = computeExpenseLedgerPaymentStatus(P6_S2_EXPENSE_TOTAL, paid);

    expect(allocation.salaryAmount.toFixed(2)).toBe(P6_S2_SALARY_PAID.toFixed(2));
    expect(allocation.bonusCash.toFixed(2)).toBe(P6_S2_NAMED_BONUS_PAID.toFixed(2));
    expect(allocation.salaryRemainingAfter.toFixed(2)).toBe(
      P6_S2_SALARY_REMAINING_AFTER.toFixed(2),
    );
    expect(bonus?.remaining.toFixed(2)).toBe(P6_S2_BONUS_REMAINING.toFixed(2));
    expect(paid.toFixed(2)).toBe(P6_S2_CASH.toFixed(2));
    expect(P6_S2_EXPENSE_REMAINING.toFixed(2)).toBe(P6_S2_BONUS_REMAINING.toFixed(2));
    expect(expenseStatus).toBe('PARTIAL');
    expect(P6_S2_EXPENSE_FULLY_PAID).toBe(false);
  });
});
