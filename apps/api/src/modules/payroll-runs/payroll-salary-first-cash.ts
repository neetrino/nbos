import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { moneyAmount, moneyText } from './payroll-allocation-source-amounts';

export const PAYROLL_CASH_NOTES_PREFIX = 'nbos:v1:payrollCash:';

export const PAYROLL_CASH_ERRORS = {
  cashPositive: 'Payroll cash amount must be a positive number',
  bonusMustAssign: 'Payroll bonus cash must be assigned explicitly',
  assignmentMismatch: 'Payroll cash bonus assignment does not match bonus cash',
  exceedsApproved: 'Payroll cash cannot assign more bonus than was approved',
  partsMustEqualCash: 'Payroll salary part plus bonus parts must equal the cash',
  unknownBonus: 'Payroll cash bonus assignment must name an approved bonus',
  duplicateBonus: 'Payroll cash bonus assignment cannot repeat the same bonus',
  exceedsCarry: 'Payroll cash cannot assign more carry than was applied to this line',
} as const;

export type PayrollCashBonusAssignmentInput = {
  bonusReleaseId: string;
  amount: string;
};

export type PayrollCashBonusPart = {
  bonusReleaseId: string;
  amount: Decimal;
};

export type PayrollCashAssignableBonus = {
  bonusReleaseId: string;
  remaining: Decimal;
};

export type AllocateSalaryFirstCashInput = {
  cash: Decimal;
  salaryRemaining: Decimal;
  bonuses: readonly PayrollCashAssignableBonus[];
  assignments: readonly PayrollCashBonusPart[];
  carryRemaining?: Decimal;
  /** Set only when this payment is explicitly earlier unpaid carry, with no bonus part. */
  requestedCarry?: Decimal;
};

export type SalaryFirstCashAllocation = {
  cash: Decimal;
  salaryAmount: Decimal;
  salaryRemainingAfter: Decimal;
  bonusCash: Decimal;
  bonusParts: PayrollCashBonusPart[];
  carryAmount: Decimal;
};

export type BonusCashBalance = {
  bonusReleaseId: string;
  paid: Decimal;
  remaining: Decimal;
};

export function payrollCashApprovedAmount(release: {
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
}): Decimal {
  return moneyAmount(release.payrollIncludedAmount ?? release.amount);
}

export function salaryRemainingBeforeCash(baseSalary: Decimal, alreadyPaidCash: Decimal): Decimal {
  const salaryCap = moneyAmount(baseSalary);
  const paid = moneyAmount(alreadyPaidCash);
  const salaryPaid = Decimal.min(paid, salaryCap);
  return moneyAmount(Decimal.max(BONUS_POOL_ZERO, salaryCap.minus(salaryPaid)));
}

export function carryRemainingBeforeCash(
  carryApplied: Decimal | null | undefined,
  alreadyPaidCarry: Decimal,
): Decimal {
  const applied = moneyAmount(carryApplied ?? BONUS_POOL_ZERO);
  return moneyAmount(Decimal.max(BONUS_POOL_ZERO, applied.minus(moneyAmount(alreadyPaidCarry))));
}

export function parsePayrollCashBonusAssignments(
  input: readonly PayrollCashBonusAssignmentInput[] | undefined,
): PayrollCashBonusPart[] {
  if (input == null || input.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  return input.map((row) => parseOneBonusAssignment(row, seen));
}

export function allocateSalaryFirstCash(
  input: AllocateSalaryFirstCashInput,
): SalaryFirstCashAllocation {
  const cash = moneyAmount(input.cash);
  const salaryRemaining = moneyAmount(input.salaryRemaining);
  if (!cash.isFinite() || cash.lte(BONUS_POOL_ZERO)) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.cashPositive);
  }
  const salaryAmount = moneyAmount(Decimal.min(cash, salaryRemaining));
  const leftover = moneyAmount(cash.minus(salaryAmount));
  const split = splitLeftoverAfterSalary({
    leftover,
    bonuses: input.bonuses,
    assignments: input.assignments,
    carryRemaining: moneyAmount(input.carryRemaining ?? BONUS_POOL_ZERO),
    requestedCarry: input.requestedCarry,
  });
  assertPartsEqualCash(cash, salaryAmount, split.bonusParts, split.carryAmount);
  return {
    cash,
    salaryAmount,
    salaryRemainingAfter: moneyAmount(salaryRemaining.minus(salaryAmount)),
    bonusCash: sumBonusParts(split.bonusParts),
    bonusParts: split.bonusParts,
    carryAmount: split.carryAmount,
  };
}

export function summarizeBonusCashBalances(
  bonuses: readonly PayrollCashAssignableBonus[],
  parts: readonly PayrollCashBonusPart[],
): BonusCashBalance[] {
  const paidById = new Map<string, Decimal>();
  for (const part of parts) {
    paidById.set(part.bonusReleaseId, moneyAmount(part.amount));
  }
  return bonuses.map((bonus) => {
    const paid = paidById.get(bonus.bonusReleaseId) ?? BONUS_POOL_ZERO;
    return {
      bonusReleaseId: bonus.bonusReleaseId,
      paid,
      remaining: moneyAmount(Decimal.max(BONUS_POOL_ZERO, bonus.remaining.minus(paid))),
    };
  });
}

function parseOneBonusAssignment(
  row: PayrollCashBonusAssignmentInput,
  seen: Set<string>,
): PayrollCashBonusPart {
  const bonusReleaseId = row.bonusReleaseId?.trim() ?? '';
  if (bonusReleaseId.length === 0) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.unknownBonus);
  }
  if (seen.has(bonusReleaseId)) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.duplicateBonus);
  }
  seen.add(bonusReleaseId);
  const amount = moneyAmount(decimalFrom(row.amount));
  if (!amount.isFinite() || amount.lte(BONUS_POOL_ZERO)) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.assignmentMismatch);
  }
  return { bonusReleaseId, amount };
}

function splitLeftoverAfterSalary(input: {
  leftover: Decimal;
  bonuses: readonly PayrollCashAssignableBonus[];
  assignments: readonly PayrollCashBonusPart[];
  carryRemaining: Decimal;
  requestedCarry?: Decimal;
}): { bonusParts: PayrollCashBonusPart[]; carryAmount: Decimal } {
  if (input.leftover.eq(BONUS_POOL_ZERO)) {
    if (input.assignments.length > 0) {
      throw new BadRequestException(PAYROLL_CASH_ERRORS.assignmentMismatch);
    }
    return { bonusParts: [], carryAmount: BONUS_POOL_ZERO };
  }
  if (input.assignments.length === 0) {
    return explicitCarryOnly(input);
  }
  const remaining = new Map(
    input.bonuses.map((row) => [row.bonusReleaseId, moneyAmount(row.remaining)]),
  );
  const bonusParts = input.assignments.map((row) => consumeBonusAssignment(row, remaining));
  const assigned = sumBonusParts(bonusParts);
  if (assigned.gt(input.leftover)) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.assignmentMismatch);
  }
  const afterAssigned = moneyAmount(input.leftover.minus(assigned));
  const carryAmount = moneyAmount(Decimal.min(afterAssigned, input.carryRemaining));
  if (carryAmount.gt(input.carryRemaining)) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.exceedsCarry);
  }
  rejectUnassignedLeftover(afterAssigned.minus(carryAmount), bonusParts.length);
  return { bonusParts, carryAmount };
}

function explicitCarryOnly(input: {
  leftover: Decimal;
  carryRemaining: Decimal;
  requestedCarry?: Decimal;
}): { bonusParts: PayrollCashBonusPart[]; carryAmount: Decimal } {
  const requested = moneyAmount(input.requestedCarry ?? BONUS_POOL_ZERO);
  if (!requested.eq(input.leftover) || requested.gt(input.carryRemaining)) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.bonusMustAssign);
  }
  return { bonusParts: [], carryAmount: requested };
}

function rejectUnassignedLeftover(unassigned: Decimal, assignedCount: number): void {
  if (moneyAmount(unassigned).lte(BONUS_POOL_ZERO)) {
    return;
  }
  if (assignedCount === 0) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.bonusMustAssign);
  }
  throw new BadRequestException(PAYROLL_CASH_ERRORS.assignmentMismatch);
}

function sumBonusParts(parts: readonly PayrollCashBonusPart[]): Decimal {
  return moneyAmount(parts.reduce((sum, part) => sum.plus(part.amount), BONUS_POOL_ZERO));
}

function consumeBonusAssignment(
  assignment: PayrollCashBonusPart,
  remaining: Map<string, Decimal>,
): PayrollCashBonusPart {
  const available = remaining.get(assignment.bonusReleaseId);
  if (available == null) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.unknownBonus);
  }
  const amount = moneyAmount(assignment.amount);
  if (amount.gt(available)) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.exceedsApproved);
  }
  remaining.set(assignment.bonusReleaseId, moneyAmount(available.minus(amount)));
  return { bonusReleaseId: assignment.bonusReleaseId, amount };
}

function assertPartsEqualCash(
  cash: Decimal,
  salaryAmount: Decimal,
  bonusParts: readonly PayrollCashBonusPart[],
  carryAmount: Decimal,
): void {
  const partsSum = bonusParts.reduce(
    (sum, part) => sum.plus(part.amount),
    salaryAmount.plus(carryAmount),
  );
  if (!moneyAmount(partsSum).eq(moneyAmount(cash))) {
    throw new BadRequestException(PAYROLL_CASH_ERRORS.partsMustEqualCash);
  }
}

export function payrollCashMoneyText(value: Decimal): string {
  return moneyText(value);
}
