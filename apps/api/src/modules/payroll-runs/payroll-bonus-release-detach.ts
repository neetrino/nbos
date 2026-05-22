import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, type PayrollRunStatusEnum, type TransactionClient } from '@nbos/database';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import { resolveSalaryLineStatus } from './payroll-salary-line-ledger-sync';

const DETACH_ALLOWED: PayrollRunStatusEnum[] = ['DRAFT', 'REVIEW'];

export type BonusReleaseDetachTx = Pick<
  TransactionClient,
  'payrollRun' | 'bonusRelease' | 'salaryLine'
>;

export interface DetachBonusReleasesParams {
  payrollRunId: string;
  releaseIds: string[];
}

function computeLineTotalPayable(line: {
  baseSalary: Decimal;
  bonusesTotal: Decimal;
  adjustmentsTotal: Decimal;
  deductionsTotal: Decimal;
}): Decimal {
  return line.baseSalary
    .plus(line.bonusesTotal)
    .plus(line.adjustmentsTotal)
    .minus(line.deductionsTotal);
}

/**
 * Reverts `INCLUDED_IN_PAYROLL` releases from salary lines (draft/review run only).
 * Releases return to `APPROVED` with `payrollRunId` cleared for re-attachment.
 */
export async function detachBonusReleasesFromPayrollRun(
  tx: BonusReleaseDetachTx,
  params: DetachBonusReleasesParams,
): Promise<void> {
  const { payrollRunId, releaseIds } = params;
  if (releaseIds.length === 0) {
    throw new BadRequestException('releaseIds must be non-empty');
  }

  const uniqueIds = [...new Set(releaseIds)];

  const run = await tx.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: { id: true, status: true },
  });
  if (!run) {
    throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
  }
  if (!DETACH_ALLOWED.includes(run.status)) {
    throw new BadRequestException(
      `Bonus releases can only be detached while the payroll run is DRAFT or REVIEW (current: ${run.status}).`,
    );
  }

  const releases = await tx.bonusRelease.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      employeeId: true,
      amount: true,
      payrollIncludedAmount: true,
      status: true,
      payrollRunId: true,
    },
  });
  if (releases.length !== uniqueIds.length) {
    throw new BadRequestException('One or more bonus release ids were not found.');
  }

  for (const rel of releases) {
    if (rel.status !== 'INCLUDED_IN_PAYROLL') {
      throw new BadRequestException(
        `Bonus release ${rel.id} is not INCLUDED_IN_PAYROLL (current: ${rel.status}).`,
      );
    }
    if (rel.payrollRunId !== payrollRunId) {
      throw new BadRequestException(`Bonus release ${rel.id} is not part of this payroll run.`);
    }
  }

  for (const rel of releases) {
    const line = await tx.salaryLine.findUnique({
      where: {
        payrollRunId_employeeId: { payrollRunId, employeeId: rel.employeeId },
      },
    });
    if (!line) {
      throw new BadRequestException(
        `No salary line for employee ${rel.employeeId} in this payroll run.`,
      );
    }

    const applied = rel.payrollIncludedAmount ?? rel.amount;

    if (line.bonusesTotal.lt(applied)) {
      throw new BadRequestException(
        `Salary line bonus total is lower than release ${rel.id}; cannot detach safely.`,
      );
    }

    const nextBonuses = line.bonusesTotal.minus(applied);
    const nextTotal = computeLineTotalPayable({
      baseSalary: line.baseSalary,
      bonusesTotal: nextBonuses,
      adjustmentsTotal: line.adjustmentsTotal,
      deductionsTotal: line.deductionsTotal,
    });
    const paid = line.paidAmount;
    const nextRemaining = Decimal.max(new Decimal(0), nextTotal.minus(paid));
    const nextStatus = resolveSalaryLineStatus(nextTotal, paid);

    await tx.salaryLine.update({
      where: { id: line.id },
      data: {
        bonusesTotal: nextBonuses,
        totalPayable: nextTotal,
        remainingAmount: nextRemaining,
        status: nextStatus,
      },
    });

    await tx.bonusRelease.update({
      where: { id: rel.id },
      data: {
        status: 'APPROVED',
        payrollRunId: null,
        payrollIncludedAmount: null,
        kpiBurnedAmount: null,
      },
    });
  }

  await recalculatePayrollRunTotalsFromSalaryLines(tx, payrollRunId);
}
