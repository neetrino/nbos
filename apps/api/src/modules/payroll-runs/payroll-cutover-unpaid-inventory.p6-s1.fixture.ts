import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { encodePayrollCashNotes } from './payroll-salary-first-cash-notes';
import { encodePayrollCashRefundNotes } from './payroll-salary-first-cash-reverse';
import {
  P6_S1_CARRY,
  P6_S1_CARRY_EMPLOYEE_ID,
  P6_S1_CARRY_ENTRY_ID,
  P6_S1_CARRY_RELEASE_ID,
  P6_S1_CLOSED_EMPLOYEE_ID,
  P6_S1_CLOSED_ENTRY_ID,
  P6_S1_CLOSED_RELEASE_ID,
  P6_S1_INCLUDED_EMPLOYEE_ID,
  P6_S1_INCLUDED_ENTRY_ID,
  P6_S1_INCLUDED_GROSS,
  P6_S1_INCLUDED_PAID_CASH,
  P6_S1_INCLUDED_RELEASE,
  P6_S1_INCLUDED_RELEASE_ID,
  P6_S1_OLDER_EMPLOYEE_ID,
  P6_S1_OLDER_ENTRY_ID,
  P6_S1_OLDER_UNPAID,
  P6_S1_PAID_EMPLOYEE_ID,
  P6_S1_PAID_LINE_ID,
  P6_S1_PAID_SALARY,
  P6_S1_PARTIAL_EMPLOYEE_ID,
  P6_S1_PARTIAL_ENTRY_ID,
  P6_S1_PARTIAL_PAID_CASH,
  P6_S1_PARTIAL_PLANNED,
  P6_S1_PARTIAL_RELEASE_ID,
  P6_S1_RESIDUAL,
  P6_S1_RESIDUAL_EMPLOYEE_ID,
  P6_S1_RESIDUAL_PAYMENT_ID,
} from './payroll-cutover-unpaid-inventory.p6-s1.amounts';
import type {
  CutoverBonusEntrySnapshot,
  CutoverBonusReleaseSnapshot,
  CutoverPaymentSnapshot,
  CutoverSalaryLineSnapshot,
} from './payroll-cutover-unpaid-inventory.types';

export type P6S1InventoryFixture = {
  prisma: MockPrisma;
  carryRelease: CutoverBonusReleaseSnapshot;
  entries: CutoverBonusEntrySnapshot[];
  releases: CutoverBonusReleaseSnapshot[];
  salaryLines: CutoverSalaryLineSnapshot[];
  payments: CutoverPaymentSnapshot[];
};

export function createP6S1InventoryFixture(): P6S1InventoryFixture {
  const carryRelease = leftoverCarryRelease();
  const entries = [
    olderUnpaidEntry(),
    partialEntry(),
    includedEntry(),
    carryEntry(),
    closedIncludedEntry(),
  ];
  const releases = [partialRelease(), includedRelease(), carryRelease, closedIncludedRelease()];
  const salaryLines = [paidSalaryLine(), residualSalaryLine(), includedSalaryLine()];
  const payments = [
    partialCashPayment(),
    includedCashPayment(),
    closedCashPayment(),
    residualRefundPayment(),
  ];
  const prisma = createMockPrisma();
  wireReadOnlyFinds(prisma, { entries, releases, salaryLines, payments });
  return { prisma, carryRelease, entries, releases, salaryLines, payments };
}

function olderUnpaidEntry(): CutoverBonusEntrySnapshot {
  return bonusEntry(P6_S1_OLDER_ENTRY_ID, P6_S1_OLDER_EMPLOYEE_ID, P6_S1_OLDER_UNPAID, '2026-08');
}

function partialEntry(): CutoverBonusEntrySnapshot {
  return {
    ...bonusEntry(
      P6_S1_PARTIAL_ENTRY_ID,
      P6_S1_PARTIAL_EMPLOYEE_ID,
      P6_S1_PARTIAL_PLANNED,
      '2026-07',
    ),
    status: 'PAID',
  };
}

function includedEntry(): CutoverBonusEntrySnapshot {
  return bonusEntry(
    P6_S1_INCLUDED_ENTRY_ID,
    P6_S1_INCLUDED_EMPLOYEE_ID,
    P6_S1_INCLUDED_RELEASE,
    '2026-09',
  );
}

function carryEntry(): CutoverBonusEntrySnapshot {
  return bonusEntry(P6_S1_CARRY_ENTRY_ID, P6_S1_CARRY_EMPLOYEE_ID, P6_S1_CARRY, '2026-04');
}

function closedIncludedEntry(): CutoverBonusEntrySnapshot {
  return bonusEntry(
    P6_S1_CLOSED_ENTRY_ID,
    P6_S1_CLOSED_EMPLOYEE_ID,
    P6_S1_INCLUDED_RELEASE,
    '2026-06',
  );
}

function partialRelease(): CutoverBonusReleaseSnapshot {
  return bonusRelease({
    id: P6_S1_PARTIAL_RELEASE_ID,
    entryId: P6_S1_PARTIAL_ENTRY_ID,
    employeeId: P6_S1_PARTIAL_EMPLOYEE_ID,
    amount: P6_S1_PARTIAL_PLANNED,
    status: 'APPROVED',
    run: null,
  });
}

function includedRelease(): CutoverBonusReleaseSnapshot {
  return bonusRelease({
    id: P6_S1_INCLUDED_RELEASE_ID,
    entryId: P6_S1_INCLUDED_ENTRY_ID,
    employeeId: P6_S1_INCLUDED_EMPLOYEE_ID,
    amount: P6_S1_INCLUDED_GROSS,
    payrollIncludedAmount: P6_S1_INCLUDED_RELEASE,
    status: 'INCLUDED_IN_PAYROLL',
    run: { id: 'pr-open', status: 'PAYING', payrollMonth: '2026-10' },
  });
}

function leftoverCarryRelease(): CutoverBonusReleaseSnapshot {
  return {
    ...bonusRelease({
      id: P6_S1_CARRY_RELEASE_ID,
      entryId: P6_S1_CARRY_ENTRY_ID,
      employeeId: P6_S1_CARRY_EMPLOYEE_ID,
      amount: P6_S1_CARRY,
      payrollIncludedAmount: BONUS_POOL_ZERO,
      status: 'INCLUDED_IN_PAYROLL',
      run: { id: 'pr-april', status: 'CLOSED', payrollMonth: '2026-04' },
    }),
    payrollCarryOverAmount: P6_S1_CARRY,
    payrollCarryOverRemaining: P6_S1_CARRY,
  };
}

function closedIncludedRelease(): CutoverBonusReleaseSnapshot {
  return bonusRelease({
    id: P6_S1_CLOSED_RELEASE_ID,
    entryId: P6_S1_CLOSED_ENTRY_ID,
    employeeId: P6_S1_CLOSED_EMPLOYEE_ID,
    amount: P6_S1_INCLUDED_GROSS,
    payrollIncludedAmount: P6_S1_INCLUDED_RELEASE,
    status: 'INCLUDED_IN_PAYROLL',
    run: { id: 'pr-closed', status: 'CLOSED', payrollMonth: '2026-06' },
  });
}

function paidSalaryLine(): CutoverSalaryLineSnapshot {
  return {
    id: P6_S1_PAID_LINE_ID,
    employeeId: P6_S1_PAID_EMPLOYEE_ID,
    expenseId: 'ex-paid',
    paidAmount: P6_S1_PAID_SALARY,
    remainingAmount: BONUS_POOL_ZERO,
    status: 'PAID',
    payrollRun: { id: 'pr-paid', status: 'CLOSED' },
  };
}

function residualSalaryLine(): CutoverSalaryLineSnapshot {
  return {
    id: 'sl-residual',
    employeeId: P6_S1_RESIDUAL_EMPLOYEE_ID,
    expenseId: 'ex-residual',
    paidAmount: BONUS_POOL_ZERO,
    remainingAmount: BONUS_POOL_ZERO,
    status: 'APPROVED',
    payrollRun: { id: 'pr-residual', status: 'PAYING' },
  };
}

function includedSalaryLine(): CutoverSalaryLineSnapshot {
  return {
    id: 'sl-included',
    employeeId: P6_S1_INCLUDED_EMPLOYEE_ID,
    expenseId: 'ex-included',
    paidAmount: P6_S1_INCLUDED_PAID_CASH,
    remainingAmount: P6_S1_INCLUDED_RELEASE.minus(P6_S1_INCLUDED_PAID_CASH),
    status: 'PARTIALLY_PAID',
    payrollRun: { id: 'pr-open', status: 'PAYING' },
  };
}

function partialCashPayment(): CutoverPaymentSnapshot {
  return {
    id: 'pay-partial',
    expenseId: 'ex-partial',
    amount: P6_S1_PARTIAL_PAID_CASH,
    notes: encodedBonusCash(P6_S1_PARTIAL_RELEASE_ID, P6_S1_PARTIAL_PAID_CASH),
  };
}

function includedCashPayment(): CutoverPaymentSnapshot {
  return {
    id: 'pay-included',
    expenseId: 'ex-included',
    amount: P6_S1_INCLUDED_PAID_CASH,
    notes: encodedBonusCash(P6_S1_INCLUDED_RELEASE_ID, P6_S1_INCLUDED_PAID_CASH),
  };
}

function closedCashPayment(): CutoverPaymentSnapshot {
  return {
    id: 'pay-closed',
    expenseId: 'ex-closed',
    amount: P6_S1_INCLUDED_PAID_CASH,
    notes: encodedBonusCash(P6_S1_CLOSED_RELEASE_ID, P6_S1_INCLUDED_PAID_CASH),
  };
}

function residualRefundPayment(): CutoverPaymentSnapshot {
  return {
    id: P6_S1_RESIDUAL_PAYMENT_ID,
    expenseId: 'ex-residual',
    amount: P6_S1_RESIDUAL,
    notes: encodePayrollCashRefundNotes({
      salaryAmount: BONUS_POOL_ZERO,
      bonusParts: [],
      residualAmount: P6_S1_RESIDUAL,
      sourcePaymentId: 'pay-residual-source',
      idempotencyKey: null,
    }),
  };
}

function bonusEntry(
  id: string,
  employeeId: string,
  amount: Decimal,
  earnedPeriod: string,
): CutoverBonusEntrySnapshot {
  return { id, employeeId, amount, earnedPeriod, status: 'ACTIVE' };
}

function bonusRelease(params: {
  id: string;
  entryId: string;
  employeeId: string;
  amount: Decimal;
  payrollIncludedAmount?: Decimal | null;
  status: string;
  run: CutoverBonusReleaseSnapshot['payrollRun'];
}): CutoverBonusReleaseSnapshot {
  return {
    id: params.id,
    bonusEntryId: params.entryId,
    employeeId: params.employeeId,
    amount: params.amount,
    payrollIncludedAmount: params.payrollIncludedAmount ?? null,
    kpiBurnedAmount: null,
    status: params.status,
    payrollRunId: params.run?.id ?? null,
    payrollCarryOverAmount: null,
    payrollCarryOverRemaining: null,
    payrollRun: params.run,
  };
}

function encodedBonusCash(bonusReleaseId: string, amount: Decimal): string {
  return encodePayrollCashNotes({
    cash: amount,
    salaryAmount: BONUS_POOL_ZERO,
    salaryRemainingAfter: BONUS_POOL_ZERO,
    bonusCash: amount,
    bonusParts: [{ bonusReleaseId, amount }],
    carryAmount: BONUS_POOL_ZERO,
  });
}

function wireReadOnlyFinds(
  prisma: MockPrisma,
  data: {
    entries: CutoverBonusEntrySnapshot[];
    releases: CutoverBonusReleaseSnapshot[];
    salaryLines: CutoverSalaryLineSnapshot[];
    payments: CutoverPaymentSnapshot[];
  },
): void {
  prisma.bonusEntry.findMany.mockResolvedValue(data.entries);
  prisma.bonusRelease.findMany.mockResolvedValue(data.releases);
  prisma.salaryLine.findMany.mockResolvedValue(data.salaryLines);
  prisma.expensePayment.findMany.mockResolvedValue(data.payments);
}
