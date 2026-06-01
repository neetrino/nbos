import { Decimal, type TransactionClient } from '@nbos/database';

import { applyPayrollBonusCap } from './payroll-bonus-cap';
import { resolveSalaryLineStatus } from './payroll-salary-line-ledger-sync';
import { computeSalaryLineTotalPayable } from './payroll-salary-line-total-payable';

const ZERO = new Decimal(0);

type CarryOverApplyTx = Pick<TransactionClient, 'bonusRelease' | 'salaryLine'>;

type SalaryLineSnapshot = {
  id: string;
  baseSalary: Decimal;
  bonusesTotal: Decimal;
  paidAmount: Decimal;
};

type PendingCarryRow = {
  id: string;
  payrollCarryOverRemaining: Decimal;
};

async function loadPendingCarryRows(
  tx: CarryOverApplyTx,
  employeeId: string,
  payrollMonth: string,
): Promise<PendingCarryRow[]> {
  const rows = await tx.bonusRelease.findMany({
    where: {
      employeeId,
      payrollCarryOverRemaining: { gt: 0 },
      status: { in: ['INCLUDED_IN_PAYROLL', 'PAID'] },
      payrollRun: { payrollMonth: { lt: payrollMonth } },
    },
    orderBy: { payrollRun: { payrollMonth: 'asc' } },
    select: { id: true, payrollCarryOverRemaining: true },
  });
  return rows.filter((row): row is PendingCarryRow => row.payrollCarryOverRemaining != null);
}

async function consumeCarryFifo(
  tx: CarryOverApplyTx,
  rows: PendingCarryRow[],
  applied: Decimal,
): Promise<void> {
  let left = applied;
  for (const row of rows) {
    if (left.lte(0)) {
      break;
    }
    const take = Decimal.min(left, row.payrollCarryOverRemaining);
    const nextRemaining = row.payrollCarryOverRemaining.minus(take);
    await tx.bonusRelease.update({
      where: { id: row.id },
      data: {
        payrollCarryOverRemaining: nextRemaining.lte(0) ? null : nextRemaining,
      },
    });
    left = left.minus(take);
  }
}

async function bumpSalaryLineForCarry(
  tx: CarryOverApplyTx,
  line: SalaryLineSnapshot,
  applied: Decimal,
): Promise<void> {
  const nextBonuses = line.bonusesTotal.plus(applied);
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
}

/**
 * Applies prior-month cap carry-over to the salary line once per attach batch (FIFO, respects cap).
 */
/** Sum of cap carry-over still owed from prior payroll months. */
export async function sumPendingPayrollCarryOver(
  tx: CarryOverApplyTx,
  employeeId: string,
  payrollMonth: string,
): Promise<Decimal> {
  const rows = await loadPendingCarryRows(tx, employeeId, payrollMonth);
  let total = ZERO;
  for (const row of rows) {
    total = total.plus(row.payrollCarryOverRemaining);
  }
  return total;
}

export async function applyPendingPayrollCarryOver(
  tx: CarryOverApplyTx,
  params: {
    employeeId: string;
    payrollMonth: string;
    line: SalaryLineSnapshot;
    bonusCapBaseSalaryMultiplier: Decimal;
  },
): Promise<Decimal> {
  const pendingRows = await loadPendingCarryRows(tx, params.employeeId, params.payrollMonth);
  if (pendingRows.length === 0) {
    return ZERO;
  }

  let totalPending = ZERO;
  for (const row of pendingRows) {
    totalPending = totalPending.plus(row.payrollCarryOverRemaining);
  }
  if (totalPending.lte(0)) {
    return ZERO;
  }

  const capped = applyPayrollBonusCap({
    kpiScaledAmount: totalPending,
    currentBonusesTotal: params.line.bonusesTotal,
    baseSalary: params.line.baseSalary,
    bonusCapBaseSalaryMultiplier: params.bonusCapBaseSalaryMultiplier,
  });
  const applied = capped.payrollIncludedAmount;
  if (applied.lte(0)) {
    return ZERO;
  }

  await consumeCarryFifo(tx, pendingRows, applied);
  await bumpSalaryLineForCarry(tx, params.line, applied);
  await tx.salaryLine.update({
    where: { id: params.line.id },
    data: { payrollCarryAppliedAmount: applied },
  });
  return applied;
}
