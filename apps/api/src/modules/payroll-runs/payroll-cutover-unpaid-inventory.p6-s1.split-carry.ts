import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { encodePayrollCashNotes } from './payroll-salary-first-cash-notes';
import {
  P6_S1_CARRY_USED,
  P6_S1_REATTACH_EMPLOYEE_ID,
  P6_S1_REATTACH_ENTRY_ID,
  P6_S1_REATTACH_RELEASE_A,
  P6_S1_REATTACH_RELEASE_B,
  P6_S1_SPLIT_CARRY,
  P6_S1_SPLIT_EMPLOYEE_ID,
  P6_S1_SPLIT_ENTRY_ID,
  P6_S1_SPLIT_INCLUDED_PAID,
  P6_S1_SPLIT_PLANNED,
  P6_S1_SPLIT_REATTACH_INCLUDED,
  P6_S1_SPLIT_RELEASE_A,
  P6_S1_SPLIT_RELEASE_B,
  P6_S1_SPLIT_UNRELEASED,
} from './payroll-cutover-unpaid-inventory.p6-s1.amounts';
import type {
  CutoverBonusEntrySnapshot,
  CutoverBonusReleaseSnapshot,
  CutoverPaymentSnapshot,
  CutoverUnpaidSnapshots,
} from './payroll-cutover-unpaid-inventory.types';

/** Entry 200000: 30000 paid + 70000 leftover carry + 100000 unreleased. */
export function splitCarryAndUnreleasedSnapshots(): CutoverUnpaidSnapshots {
  return splitSnapshots({
    employeeId: P6_S1_SPLIT_EMPLOYEE_ID,
    entryId: P6_S1_SPLIT_ENTRY_ID,
    releaseAId: P6_S1_SPLIT_RELEASE_A,
    releaseBId: P6_S1_SPLIT_RELEASE_B,
    included: P6_S1_SPLIT_INCLUDED_PAID,
    leftover: P6_S1_SPLIT_CARRY,
    consumedRemembered: P6_S1_SPLIT_CARRY,
    open: false,
    cash: P6_S1_SPLIT_INCLUDED_PAID,
  });
}

/**
 * After 60000 of the 70000 carry was used, April remembers 60000 consumed
 * and October includes the remaining 40000. Unreleased 100000 stays unpaid.
 */
export function splitCarryReattachedSnapshots(): CutoverUnpaidSnapshots {
  return splitSnapshots({
    employeeId: P6_S1_REATTACH_EMPLOYEE_ID,
    entryId: P6_S1_REATTACH_ENTRY_ID,
    releaseAId: P6_S1_REATTACH_RELEASE_A,
    releaseBId: P6_S1_REATTACH_RELEASE_B,
    included: P6_S1_SPLIT_REATTACH_INCLUDED,
    leftover: null,
    consumedRemembered: P6_S1_CARRY_USED,
    open: true,
    cash: BONUS_POOL_ZERO,
  });
}

function splitSnapshots(params: {
  employeeId: string;
  entryId: string;
  releaseAId: string;
  releaseBId: string;
  included: Decimal;
  leftover: Decimal | null;
  consumedRemembered: Decimal;
  open: boolean;
  cash: Decimal;
}): CutoverUnpaidSnapshots {
  const run = params.open
    ? { id: 'pr-split-open', status: 'PAYING', payrollMonth: '2026-10' }
    : { id: 'pr-split-april', status: 'CLOSED', payrollMonth: '2026-04' };
  return {
    entries: [splitEntry(params.entryId, params.employeeId)],
    releases: [releaseA(params, run), unreleasedB(params)],
    salaryLines: [],
    payments: params.cash.gt(BONUS_POOL_ZERO) ? [paidIncluded(params.releaseAId, params.cash)] : [],
  };
}

function splitEntry(id: string, employeeId: string): CutoverBonusEntrySnapshot {
  return {
    id,
    employeeId,
    amount: P6_S1_SPLIT_PLANNED,
    earnedPeriod: '2026-04',
    status: 'ACTIVE',
  };
}

function releaseA(
  params: {
    employeeId: string;
    entryId: string;
    releaseAId: string;
    included: Decimal;
    leftover: Decimal | null;
    consumedRemembered: Decimal;
  },
  run: NonNullable<CutoverBonusReleaseSnapshot['payrollRun']>,
): CutoverBonusReleaseSnapshot {
  return {
    id: params.releaseAId,
    bonusEntryId: params.entryId,
    employeeId: params.employeeId,
    amount: P6_S1_SPLIT_UNRELEASED,
    payrollIncludedAmount: params.included,
    kpiBurnedAmount: null,
    status: 'INCLUDED_IN_PAYROLL',
    payrollRunId: run.id,
    payrollCarryOverAmount: params.consumedRemembered,
    payrollCarryOverRemaining: params.leftover,
    payrollRun: run,
  };
}

function unreleasedB(params: {
  employeeId: string;
  entryId: string;
  releaseBId: string;
}): CutoverBonusReleaseSnapshot {
  return {
    id: params.releaseBId,
    bonusEntryId: params.entryId,
    employeeId: params.employeeId,
    amount: P6_S1_SPLIT_UNRELEASED,
    payrollIncludedAmount: null,
    kpiBurnedAmount: null,
    status: 'APPROVED',
    payrollRunId: null,
    payrollCarryOverAmount: null,
    payrollCarryOverRemaining: null,
    payrollRun: null,
  };
}

function paidIncluded(releaseId: string, amount: Decimal): CutoverPaymentSnapshot {
  return {
    id: `pay-${releaseId}`,
    expenseId: 'ex-split',
    amount,
    notes: encodePayrollCashNotes({
      cash: amount,
      salaryAmount: BONUS_POOL_ZERO,
      salaryRemainingAfter: BONUS_POOL_ZERO,
      bonusCash: amount,
      bonusParts: [{ bonusReleaseId: releaseId, amount }],
      carryAmount: BONUS_POOL_ZERO,
    }),
  };
}
