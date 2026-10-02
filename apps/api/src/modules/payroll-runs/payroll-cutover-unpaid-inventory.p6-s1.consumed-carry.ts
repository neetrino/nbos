import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import {
  P6_S1_CARRY,
  P6_S1_CARRY_AFTER_USE,
  P6_S1_PARTIAL_CARRY_EMPLOYEE_ID,
  P6_S1_PARTIAL_CARRY_ENTRY_ID,
  P6_S1_PARTIAL_CARRY_RELEASE_ID,
  P6_S1_USED_CARRY_EMPLOYEE_ID,
  P6_S1_USED_CARRY_ENTRY_ID,
  P6_S1_USED_CARRY_RELEASE_ID,
} from './payroll-cutover-unpaid-inventory.p6-s1.amounts';
import type {
  CutoverBonusEntrySnapshot,
  CutoverBonusReleaseSnapshot,
  CutoverUnpaidSnapshots,
} from './payroll-cutover-unpaid-inventory.types';

/** April carry of 100000, 0 included. Remaining 40000 means October used 60000. */
export function partiallyConsumedCarrySnapshots(): CutoverUnpaidSnapshots {
  return carrySnapshots({
    employeeId: P6_S1_PARTIAL_CARRY_EMPLOYEE_ID,
    entryId: P6_S1_PARTIAL_CARRY_ENTRY_ID,
    releaseId: P6_S1_PARTIAL_CARRY_RELEASE_ID,
    remaining: P6_S1_CARRY_AFTER_USE,
  });
}

/** April carry of 100000 fully used in October. Remaining is stored as null. */
export function fullyConsumedCarrySnapshots(): CutoverUnpaidSnapshots {
  return carrySnapshots({
    employeeId: P6_S1_USED_CARRY_EMPLOYEE_ID,
    entryId: P6_S1_USED_CARRY_ENTRY_ID,
    releaseId: P6_S1_USED_CARRY_RELEASE_ID,
    remaining: null,
  });
}

function carrySnapshots(params: {
  employeeId: string;
  entryId: string;
  releaseId: string;
  remaining: Decimal | null;
}): CutoverUnpaidSnapshots {
  return {
    entries: [carryEntry(params.entryId, params.employeeId)],
    releases: [carryRelease(params)],
    salaryLines: [],
    payments: [],
  };
}

function carryEntry(id: string, employeeId: string): CutoverBonusEntrySnapshot {
  return {
    id,
    employeeId,
    amount: P6_S1_CARRY,
    earnedPeriod: '2026-04',
    status: 'ACTIVE',
  };
}

function carryRelease(params: {
  employeeId: string;
  entryId: string;
  releaseId: string;
  remaining: Decimal | null;
}): CutoverBonusReleaseSnapshot {
  return {
    id: params.releaseId,
    bonusEntryId: params.entryId,
    employeeId: params.employeeId,
    amount: P6_S1_CARRY,
    payrollIncludedAmount: BONUS_POOL_ZERO,
    kpiBurnedAmount: null,
    status: 'INCLUDED_IN_PAYROLL',
    payrollRunId: 'pr-april-carry',
    payrollCarryOverAmount: P6_S1_CARRY,
    payrollCarryOverRemaining: params.remaining,
    payrollRun: { id: 'pr-april-carry', status: 'CLOSED', payrollMonth: '2026-04' },
  };
}
