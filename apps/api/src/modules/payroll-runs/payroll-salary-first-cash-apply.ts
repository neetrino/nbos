import { Decimal, type PrismaClient } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { moneyAmount } from './payroll-allocation-source-amounts';
import {
  allocateSalaryFirstCash,
  carryRemainingBeforeCash,
  parsePayrollCashBonusAssignments,
  payrollCashApprovedAmount,
  salaryRemainingBeforeCash,
  type PayrollCashAssignableBonus,
  type PayrollCashBonusAssignmentInput,
  type PayrollCashBonusPart,
  type SalaryFirstCashAllocation,
} from './payroll-salary-first-cash';
import {
  decodePayrollCashNotes,
  encodePayrollCashNotes,
  findPayrollCashPaymentByIdempotencyKey,
  sumEncodedCarryCash,
  type PayrollCashPaymentNotes,
} from './payroll-salary-first-cash-notes';
import { sumNetEncodedBonusCashByRelease } from './payroll-salary-first-cash-reverse';

export type PayrollCashReleaseRow = {
  id: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
  status: string;
};

export type PreparePayrollCashPaymentInput = {
  cash: Decimal;
  alreadyPaidCash: Decimal;
  baseSalary: Decimal;
  carryAppliedAmount?: Decimal | null;
  releases: readonly PayrollCashReleaseRow[];
  existingPayments: readonly PayrollCashPaymentNotes[];
  assignments?: readonly PayrollCashBonusAssignmentInput[];
  assignRemainingBonusCash?: boolean;
  userNotes?: string | null;
  idempotencyKey?: string | null;
};

export type PreparedPayrollCashPayment = {
  allocation: SalaryFirstCashAllocation;
  notes: string;
  existingPayment: PayrollCashPaymentNotes | null;
};

const INCLUDED_RELEASE_STATUS = 'INCLUDED_IN_PAYROLL';
const ATTRIBUTABLE_RELEASE_STATUSES = new Set(['INCLUDED_IN_PAYROLL', 'PAID']);

export function assignableBonusesFromReleases(
  releases: readonly PayrollCashReleaseRow[],
  existingPayments: readonly PayrollCashPaymentNotes[],
): PayrollCashAssignableBonus[] {
  const paidById = sumNetEncodedBonusCashByRelease(existingPayments);
  const assignable: PayrollCashAssignableBonus[] = [];
  for (const release of releases) {
    if (release.status !== INCLUDED_RELEASE_STATUS) {
      continue;
    }
    const approved = payrollCashApprovedAmount(release);
    const paid = paidById.get(release.id) ?? BONUS_POOL_ZERO;
    assignable.push({
      bonusReleaseId: release.id,
      remaining: moneyAmount(Decimal.max(BONUS_POOL_ZERO, approved.minus(paid))),
    });
  }
  return assignable;
}

export function remainingBonusAssignments(
  bonuses: readonly PayrollCashAssignableBonus[],
): PayrollCashBonusPart[] {
  return bonuses
    .filter((bonus) => bonus.remaining.gt(BONUS_POOL_ZERO))
    .map((bonus) => ({
      bonusReleaseId: bonus.bonusReleaseId,
      amount: moneyAmount(bonus.remaining),
    }));
}

export function preparePayrollCashPayment(
  input: PreparePayrollCashPaymentInput,
): PreparedPayrollCashPayment {
  const existingPayment = findPayrollCashPaymentByIdempotencyKey(
    input.existingPayments,
    input.idempotencyKey,
  );
  if (existingPayment != null) {
    return {
      allocation: allocationFromEncodedPayment(existingPayment),
      notes: existingPayment.notes ?? '',
      existingPayment,
    };
  }
  const bonuses = assignableBonusesFromReleases(input.releases, input.existingPayments);
  const allocation = allocateSalaryFirstCash({
    cash: input.cash,
    salaryRemaining: salaryRemainingBeforeCash(input.baseSalary, input.alreadyPaidCash),
    bonuses,
    assignments: resolveAssignments(input, bonuses),
    carryRemaining: carryRemainingBeforeCash(
      input.carryAppliedAmount,
      sumEncodedCarryCash(input.existingPayments),
    ),
  });
  return {
    allocation,
    notes: encodePayrollCashNotes(allocation, {
      userNotes: input.userNotes,
      idempotencyKey: input.idempotencyKey,
    }),
    existingPayment: null,
  };
}

export function fullyPaidAttributedReleaseIds(
  releases: readonly PayrollCashReleaseRow[],
  payments: readonly PayrollCashPaymentNotes[],
): string[] {
  const paidById = sumNetEncodedBonusCashByRelease(payments);
  const ids: string[] = [];
  for (const release of releases) {
    if (!ATTRIBUTABLE_RELEASE_STATUSES.has(release.status)) {
      continue;
    }
    if ((paidById.get(release.id) ?? BONUS_POOL_ZERO).gte(payrollCashApprovedAmount(release))) {
      ids.push(release.id);
    }
  }
  return ids;
}

export async function loadPayrollCashReleasesForExpense(
  prisma: Pick<PrismaClient, 'salaryLine' | 'bonusRelease'>,
  expenseId: string,
): Promise<{
  salaryLine: {
    id: string;
    payrollRunId: string;
    employeeId: string;
    baseSalary: Decimal;
    payrollCarryAppliedAmount: Decimal | null;
  } | null;
  releases: PayrollCashReleaseRow[];
}> {
  const salaryLine = await prisma.salaryLine.findUnique({
    where: { expenseId },
    select: {
      id: true,
      payrollRunId: true,
      employeeId: true,
      baseSalary: true,
      payrollCarryAppliedAmount: true,
    },
  });
  if (salaryLine == null) {
    return { salaryLine: null, releases: [] };
  }
  const releases = await prisma.bonusRelease.findMany({
    where: {
      payrollRunId: salaryLine.payrollRunId,
      employeeId: salaryLine.employeeId,
    },
    select: { id: true, amount: true, payrollIncludedAmount: true, status: true },
  });
  return { salaryLine, releases };
}

function resolveAssignments(
  input: PreparePayrollCashPaymentInput,
  bonuses: readonly PayrollCashAssignableBonus[],
): PayrollCashBonusPart[] {
  if (input.assignRemainingBonusCash === true) {
    return remainingBonusAssignments(bonuses);
  }
  return parsePayrollCashBonusAssignments(input.assignments);
}

function allocationFromEncodedPayment(payment: PayrollCashPaymentNotes): SalaryFirstCashAllocation {
  const decoded = decodePayrollCashNotes(payment.notes);
  const bonusParts = decoded?.bonusParts ?? [];
  const salaryAmount = decoded?.salaryAmount ?? BONUS_POOL_ZERO;
  const bonusCash = bonusParts.reduce((sum, part) => sum.plus(part.amount), BONUS_POOL_ZERO);
  return {
    cash: moneyAmount(payment.amount),
    salaryAmount,
    salaryRemainingAfter: BONUS_POOL_ZERO,
    bonusCash: moneyAmount(bonusCash),
    bonusParts,
    carryAmount: decoded?.carryAmount ?? BONUS_POOL_ZERO,
  };
}
