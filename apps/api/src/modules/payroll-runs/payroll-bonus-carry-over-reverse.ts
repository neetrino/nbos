import { Decimal, type TransactionClient } from '@nbos/database';

import { resolveSalaryLineStatus } from './payroll-salary-line-ledger-sync';
import { computeSalaryLineTotalPayable } from './payroll-salary-line-total-payable';

const ZERO = new Decimal(0);

type CarryReverseTx = Pick<TransactionClient, 'bonusRelease' | 'salaryLine' | 'payrollRun'>;

type PriorCarryReleaseRow = {
  id: string;
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: Decimal | null;
};

async function loadPriorCarryReleasesForRestore(
  tx: CarryReverseTx,
  employeeId: string,
  payrollMonth: string,
): Promise<PriorCarryReleaseRow[]> {
  return tx.bonusRelease.findMany({
    where: {
      employeeId,
      payrollCarryOverAmount: { gt: 0 },
      status: { in: ['INCLUDED_IN_PAYROLL', 'PAID'] },
      payrollRun: { payrollMonth: { lt: payrollMonth } },
    },
    orderBy: { payrollRun: { payrollMonth: 'desc' } },
    select: {
      id: true,
      payrollCarryOverAmount: true,
      payrollCarryOverRemaining: true,
    },
  });
}

/** Restores FIFO-consumed cap carry on prior-month releases (LIFO restore). */
export async function restorePriorPayrollCarryConsumed(
  tx: CarryReverseTx,
  params: { employeeId: string; payrollMonth: string; restoreAmount: Decimal },
): Promise<void> {
  if (params.restoreAmount.lte(0)) {
    return;
  }

  const rows = await loadPriorCarryReleasesForRestore(tx, params.employeeId, params.payrollMonth);
  let left = params.restoreAmount;

  for (const row of rows) {
    if (left.lte(0)) {
      break;
    }
    const original = row.payrollCarryOverAmount ?? ZERO;
    const current = row.payrollCarryOverRemaining ?? ZERO;
    const consumed = original.minus(current);
    if (consumed.lte(0)) {
      continue;
    }

    const restore = Decimal.min(left, consumed);
    const nextRemaining = current.plus(restore);
    await tx.bonusRelease.update({
      where: { id: row.id },
      data: {
        payrollCarryOverRemaining: nextRemaining.gte(original)
          ? original
          : nextRemaining.lte(0)
            ? null
            : nextRemaining,
      },
    });
    left = left.minus(restore);
  }
}

/**
 * Reverts prior-month carry applied to the salary line when no releases stay on the run.
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
