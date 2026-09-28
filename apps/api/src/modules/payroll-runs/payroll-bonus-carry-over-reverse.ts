import { BadRequestException } from '@nestjs/common';
import { Decimal, type TransactionClient } from '@nbos/database';

import { resolveConsumedPayrollCarryOver } from './payroll-bonus-cap';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import { resolveSalaryLineStatus } from './payroll-salary-line-ledger-sync';
import { computeSalaryLineTotalPayable } from './payroll-salary-line-total-payable';

const ZERO = new Decimal(0);

export const PAYROLL_CARRY_REVERSE_ERRORS = {
  closedPriorRestore:
    'Prior-month carry cannot be restored onto a closed or paid payroll run; leave the applied carry and settle with a current-month manual adjustment',
} as const;

type CarryReverseTx = Pick<TransactionClient, 'bonusRelease' | 'salaryLine' | 'payrollRun'>;

type PriorCarryReleaseRow = {
  id: string;
  status: string;
  employeeId: string;
  payrollRunId: string | null;
  payrollIncludedAmount: Decimal | null;
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: Decimal | null;
  payrollRun: { status: string; payrollMonth: string } | null;
};

const OPEN_PAYROLL_RUN_STATUSES = ['DRAFT', 'REVIEW'] as const;

function isOpenPayrollRunStatus(status: string | undefined): boolean {
  return status == null || OPEN_PAYROLL_RUN_STATUSES.some((open) => open === status);
}

async function loadPriorCarryReleasesForRestore(
  tx: CarryReverseTx,
  employeeId: string,
): Promise<PriorCarryReleaseRow[]> {
  return tx.bonusRelease.findMany({
    where: {
      employeeId,
      payrollCarryOverAmount: { gt: 0 },
      OR: [{ status: 'INCLUDED_IN_PAYROLL' }, { status: 'APPROVED', payrollRunId: null }],
    },
    // Consume is FIFO by payroll month; restore the same order (oldest first).
    orderBy: [{ payrollRun: { payrollMonth: 'asc' } }, { updatedAt: 'asc' }],
    select: {
      id: true,
      status: true,
      employeeId: true,
      payrollRunId: true,
      payrollIncludedAmount: true,
      payrollCarryOverAmount: true,
      payrollCarryOverRemaining: true,
      payrollRun: { select: { status: true, payrollMonth: true } },
    },
  });
}

async function restoreRemainingOnDetachedRelease(
  tx: CarryReverseTx,
  row: PriorCarryReleaseRow,
  restoreAmount: Decimal,
): Promise<Decimal> {
  const consumed = resolveConsumedPayrollCarryOver(row);
  const take = Decimal.min(restoreAmount, consumed);
  if (take.lte(0)) {
    return ZERO;
  }

  const original = row.payrollCarryOverAmount ?? ZERO;
  const current = row.payrollCarryOverRemaining ?? ZERO;
  const nextRemaining = current.plus(take);
  await tx.bonusRelease.update({
    where: { id: row.id },
    data: {
      payrollCarryOverRemaining: nextRemaining.gte(original) ? original : nextRemaining,
    },
  });
  return take;
}

async function loadOpenSalaryLineForRestore(
  tx: CarryReverseTx,
  payrollRunId: string,
  employeeId: string,
): Promise<{
  id: string;
  baseSalary: Decimal;
  bonusesTotal: Decimal;
  paidAmount: Decimal;
} | null> {
  const line = await tx.salaryLine.findUnique({
    where: { payrollRunId_employeeId: { payrollRunId, employeeId } },
    select: { id: true, baseSalary: true, bonusesTotal: true, paidAmount: true, status: true },
  });
  if (line == null || line.status === 'PAID') {
    return null;
  }
  return line;
}

async function addBonusToPriorSalaryLine(
  tx: CarryReverseTx,
  payrollRunId: string,
  line: { id: string; baseSalary: Decimal; bonusesTotal: Decimal; paidAmount: Decimal },
  amount: Decimal,
): Promise<void> {
  const nextBonuses = line.bonusesTotal.plus(amount);
  const nextTotal = computeSalaryLineTotalPayable({
    baseSalary: line.baseSalary,
    bonusesTotal: nextBonuses,
  });
  const nextRemaining = Decimal.max(ZERO, nextTotal.minus(line.paidAmount));
  await tx.salaryLine.update({
    where: { id: line.id },
    data: {
      bonusesTotal: nextBonuses,
      totalPayable: nextTotal,
      remainingAmount: nextRemaining,
      status: resolveSalaryLineStatus(nextTotal, line.paidAmount),
    },
  });
  await recalculatePayrollRunTotalsFromSalaryLines(tx, payrollRunId);
}

async function restoreConsumedOntoIncludedRelease(
  tx: CarryReverseTx,
  row: PriorCarryReleaseRow,
  restoreAmount: Decimal,
): Promise<Decimal> {
  const consumed = resolveConsumedPayrollCarryOver(row);
  const take = Decimal.min(restoreAmount, consumed);
  if (take.lte(0) || row.payrollRunId == null) {
    return ZERO;
  }
  if (!isOpenPayrollRunStatus(row.payrollRun?.status)) {
    return ZERO;
  }

  const line = await loadOpenSalaryLineForRestore(tx, row.payrollRunId, row.employeeId);
  if (line == null) {
    return ZERO;
  }

  const nextCarry = (row.payrollCarryOverAmount ?? ZERO).minus(take);
  const keepRemaining = row.payrollCarryOverRemaining != null && nextCarry.gt(0);
  await tx.bonusRelease.update({
    where: { id: row.id },
    data: {
      payrollIncludedAmount: (row.payrollIncludedAmount ?? ZERO).plus(take),
      payrollCarryOverAmount: nextCarry.gt(0) ? nextCarry : null,
      payrollCarryOverRemaining: keepRemaining ? row.payrollCarryOverRemaining : null,
    },
  });
  await addBonusToPriorSalaryLine(tx, row.payrollRunId, line, take);
  return take;
}

async function restoreOnePriorCarryRelease(
  tx: CarryReverseTx,
  row: PriorCarryReleaseRow,
  restoreAmount: Decimal,
): Promise<Decimal> {
  if (row.status === 'INCLUDED_IN_PAYROLL') {
    return restoreConsumedOntoIncludedRelease(tx, row, restoreAmount);
  }
  if (row.status === 'APPROVED') {
    return restoreRemainingOnDetachedRelease(tx, row, restoreAmount);
  }
  return ZERO;
}

async function restorableAmountForRow(
  tx: CarryReverseTx,
  row: PriorCarryReleaseRow,
): Promise<Decimal> {
  const consumed = resolveConsumedPayrollCarryOver(row);
  if (consumed.lte(0)) {
    return ZERO;
  }
  if (row.status === 'APPROVED') {
    return consumed;
  }
  if (row.status !== 'INCLUDED_IN_PAYROLL' || row.payrollRunId == null) {
    return ZERO;
  }
  if (!isOpenPayrollRunStatus(row.payrollRun?.status)) {
    return ZERO;
  }
  const line = await loadOpenSalaryLineForRestore(tx, row.payrollRunId, row.employeeId);
  return line == null ? ZERO : consumed;
}

async function sumRestorablePriorCarry(tx: CarryReverseTx, employeeId: string): Promise<Decimal> {
  const rows = await loadPriorCarryReleasesForRestore(tx, employeeId);
  let total = ZERO;
  for (const row of rows) {
    total = total.plus(await restorableAmountForRow(tx, row));
  }
  return total;
}

/** Restores FIFO-consumed cap carry on prior-month releases (oldest payroll month first). */
export async function restorePriorPayrollCarryConsumed(
  tx: CarryReverseTx,
  params: { employeeId: string; payrollMonth: string; restoreAmount: Decimal },
): Promise<void> {
  if (params.restoreAmount.lte(0)) {
    return;
  }

  const rows = await loadPriorCarryReleasesForRestore(tx, params.employeeId);
  let left = params.restoreAmount;
  for (const row of rows) {
    if (left.lte(0)) {
      break;
    }
    const restored = await restoreOnePriorCarryRelease(tx, row, left);
    left = left.minus(restored);
  }
}

/**
 * Reverts prior-month carry applied to the salary line when no releases stay on the run.
 * Refuses when the consumed carry cannot be restored (closed/PAID prior run).
 */
export async function reversePayrollCarryAppliedOnSalaryLine(
  tx: CarryReverseTx,
  params: {
    payrollRunId: string;
    payrollMonth: string;
    employeeId: string;
    line: {
      id: string;
      baseSalary: Decimal;
      bonusesTotal: Decimal;
      paidAmount: Decimal;
      payrollCarryAppliedAmount: Decimal | null;
    };
  },
): Promise<void> {
  const applied = params.line.payrollCarryAppliedAmount;
  if (applied == null || applied.lte(0)) {
    return;
  }

  const restorable = await sumRestorablePriorCarry(tx, params.employeeId);
  if (restorable.lt(applied)) {
    throw new BadRequestException(PAYROLL_CARRY_REVERSE_ERRORS.closedPriorRestore);
  }

  await restorePriorPayrollCarryConsumed(tx, {
    employeeId: params.employeeId,
    payrollMonth: params.payrollMonth,
    restoreAmount: applied,
  });

  const nextBonuses = Decimal.max(ZERO, params.line.bonusesTotal.minus(applied));
  const nextTotal = computeSalaryLineTotalPayable({
    baseSalary: params.line.baseSalary,
    bonusesTotal: nextBonuses,
  });
  const nextRemaining = Decimal.max(ZERO, nextTotal.minus(params.line.paidAmount));

  await tx.salaryLine.update({
    where: { id: params.line.id },
    data: {
      bonusesTotal: nextBonuses,
      totalPayable: nextTotal,
      remainingAmount: nextRemaining,
      status: resolveSalaryLineStatus(nextTotal, params.line.paidAmount),
      payrollCarryAppliedAmount: null,
    },
  });
}

export async function countIncludedReleasesOnRun(
  tx: Pick<TransactionClient, 'bonusRelease'>,
  payrollRunId: string,
  employeeId: string,
): Promise<number> {
  return tx.bonusRelease.count({
    where: {
      payrollRunId,
      employeeId,
      status: 'INCLUDED_IN_PAYROLL',
    },
  });
}
