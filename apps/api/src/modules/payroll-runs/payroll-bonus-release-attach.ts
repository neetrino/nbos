import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, type PayrollRunStatusEnum, type TransactionClient } from '@nbos/database';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import { resolveSalaryLineStatus } from './payroll-salary-line-ledger-sync';

const ATTACH_ALLOWED: PayrollRunStatusEnum[] = ['DRAFT', 'REVIEW'];

/** Minimal DB surface for attaching bonus releases (transaction or full client). */
export type BonusReleaseAttachTx = Pick<
  TransactionClient,
  'payrollRun' | 'bonusRelease' | 'salaryLine'
>;

export interface AttachBonusReleasesParams {
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
 * Moves approved bonus releases into a draft/review payroll run: bumps `SalaryLine.bonusesTotal`
 * and marks each release `INCLUDED_IN_PAYROLL`.
 */
export async function attachBonusReleasesToPayrollRun(
  tx: BonusReleaseAttachTx,
  params: AttachBonusReleasesParams,
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
  if (!ATTACH_ALLOWED.includes(run.status)) {
    throw new BadRequestException(
      `Bonus releases can only be attached while the payroll run is DRAFT or REVIEW (current: ${run.status}).`,
    );
  }

  const releases = await tx.bonusRelease.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      employeeId: true,
      amount: true,
      status: true,
      payrollRunId: true,
    },
  });
  if (releases.length !== uniqueIds.length) {
    throw new BadRequestException('One or more bonus release ids were not found.');
  }

  for (const rel of releases) {
    if (rel.status !== 'APPROVED') {
      throw new BadRequestException(
        `Bonus release ${rel.id} is not in APPROVED status (current: ${rel.status}).`,
      );
    }
    if (rel.payrollRunId != null && rel.payrollRunId !== payrollRunId) {
      throw new BadRequestException(`Bonus release ${rel.id} is bound to a different payroll run.`);
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
        `No salary line for employee ${rel.employeeId} in this payroll run; seed or add the line first.`,
      );
    }

    const nextBonuses = line.bonusesTotal.plus(rel.amount);
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
        status: 'INCLUDED_IN_PAYROLL',
        payrollRunId,
      },
    });
  }

  await recalculatePayrollRunTotalsFromSalaryLines(tx, payrollRunId);
}
