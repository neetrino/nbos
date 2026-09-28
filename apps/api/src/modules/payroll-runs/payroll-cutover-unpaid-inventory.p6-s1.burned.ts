import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { encodePayrollCashNotes } from './payroll-salary-first-cash-notes';
import {
  P6_S1_BURNED_EMPLOYEE_ID,
  P6_S1_BURNED_ENTRY_ID,
  P6_S1_BURNED_RELEASE_ID,
  P6_S1_INCLUDED_GROSS,
  P6_S1_INCLUDED_PAID_CASH,
  P6_S1_INCLUDED_RELEASE,
} from './payroll-cutover-unpaid-inventory.p6-s1.amounts';
import type { CutoverUnpaidSnapshots } from './payroll-cutover-unpaid-inventory.types';

/** Entry 80000, release 80000, included 60000, cash 20000. Burned 20000 is not unpaid. */
export function kpiBurnedOpenIncludedSnapshots(): CutoverUnpaidSnapshots {
  return {
    entries: [
      {
        id: P6_S1_BURNED_ENTRY_ID,
        employeeId: P6_S1_BURNED_EMPLOYEE_ID,
        amount: P6_S1_INCLUDED_GROSS,
        earnedPeriod: '2026-09',
        status: 'ACTIVE',
      },
    ],
    releases: [
      {
        id: P6_S1_BURNED_RELEASE_ID,
        bonusEntryId: P6_S1_BURNED_ENTRY_ID,
        employeeId: P6_S1_BURNED_EMPLOYEE_ID,
        amount: P6_S1_INCLUDED_GROSS,
        payrollIncludedAmount: P6_S1_INCLUDED_RELEASE,
        kpiBurnedAmount: null,
        status: 'INCLUDED_IN_PAYROLL',
        payrollRunId: 'pr-open-burned',
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
        payrollRun: { id: 'pr-open-burned', status: 'PAYING', payrollMonth: '2026-10' },
      },
    ],
    salaryLines: [],
    payments: [
      {
        id: 'pay-burned',
        expenseId: 'ex-burned',
        amount: P6_S1_INCLUDED_PAID_CASH,
        notes: encodePayrollCashNotes({
          cash: P6_S1_INCLUDED_PAID_CASH,
          salaryAmount: BONUS_POOL_ZERO,
          salaryRemainingAfter: BONUS_POOL_ZERO,
          bonusCash: P6_S1_INCLUDED_PAID_CASH,
          bonusParts: [
            { bonusReleaseId: P6_S1_BURNED_RELEASE_ID, amount: P6_S1_INCLUDED_PAID_CASH },
          ],
          carryAmount: BONUS_POOL_ZERO,
        }),
      },
    ],
  };
}
