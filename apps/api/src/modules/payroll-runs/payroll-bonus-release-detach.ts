import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, type PayrollRunStatusEnum, type TransactionClient } from '@nbos/database';
import {
  countIncludedReleasesOnRun,
  reversePayrollCarryAppliedOnSalaryLine,
} from './payroll-bonus-carry-over-reverse';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import { resolveSalaryLineStatus } from './payroll-salary-line-ledger-sync';
import { computeSalaryLineTotalPayable } from './payroll-salary-line-total-payable';

const DETACH_ALLOWED: PayrollRunStatusEnum[] = ['DRAFT', 'REVIEW'];

export type BonusReleaseDetachTx = Pick<
  TransactionClient,
  'payrollRun' | 'bonusRelease' | 'salaryLine' | '$queryRaw'
>;

export interface DetachBonusReleasesParams {
  payrollRunId: string;
  releaseIds: string[];
}

type DetachReleaseRow = {
  id: string;
  employeeId: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: Decimal | null;
  status: string;
  payrollRunId: string | null;
};

function assertDetachAllowed(status: PayrollRunStatusEnum): void {
  if (!DETACH_ALLOWED.includes(status)) {
    throw new BadRequestException(
      `Bonus releases can only be detached while the payroll run is DRAFT or REVIEW (current: ${status}).`,
    );
  }
}

function assertReleaseEligibleForDetach(rel: DetachReleaseRow, payrollRunId: string): void {
  if (rel.status !== 'INCLUDED_IN_PAYROLL') {
    throw new BadRequestException(
      `Bonus release ${rel.id} is not INCLUDED_IN_PAYROLL (current: ${rel.status}).`,
    );
  }
  if (rel.payrollRunId !== payrollRunId) {
    throw new BadRequestException(`Bonus release ${rel.id} is not part of this payroll run.`);
  }
}

async function loadPayrollRunForDetach(
  tx: BonusReleaseDetachTx,
  payrollRunId: string,
): Promise<{ id: string; status: PayrollRunStatusEnum; payrollMonth: string }> {
  const run = await tx.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: { id: true, status: true, payrollMonth: true },
  });
  if (!run) {
    throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
  }
  assertDetachAllowed(run.status);
  return run;
}

async function loadReleasesForDetach(
  tx: BonusReleaseDetachTx,
  uniqueIds: string[],
): Promise<DetachReleaseRow[]> {
  const releases = await tx.bonusRelease.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      employeeId: true,
      amount: true,
      payrollIncludedAmount: true,
      payrollCarryOverAmount: true,
      payrollCarryOverRemaining: true,
      status: true,
      payrollRunId: true,
    },
  });
  if (releases.length !== uniqueIds.length) {
    throw new BadRequestException('One or more bonus release ids were not found.');
  }
  return releases;
}

async function removeReleaseFromSalaryLine(
  tx: BonusReleaseDetachTx,
  payrollRunId: string,
  rel: DetachReleaseRow,
): Promise<void> {
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
  const nextTotal = computeSalaryLineTotalPayable({
    baseSalary: line.baseSalary,
    bonusesTotal: nextBonuses,
  });
  const nextRemaining = Decimal.max(new Decimal(0), nextTotal.minus(line.paidAmount));

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

async function markReleaseDetached(tx: BonusReleaseDetachTx, rel: DetachReleaseRow): Promise<void> {
  await tx.bonusRelease.update({
    where: { id: rel.id },
    data: {
      status: 'APPROVED',
      payrollRunId: null,
      payrollIncludedAmount: null,
      kpiBurnedAmount: null,
      kpiBurnedReason: null,
      payrollCarryOverAmount: rel.payrollCarryOverAmount,
      payrollCarryOverRemaining: rel.payrollCarryOverRemaining,
    },
  });
}

async function reverseCarryIfLineEmpty(
  tx: BonusReleaseDetachTx,
  payrollRunId: string,
  payrollMonth: string,
  employeeId: string,
): Promise<void> {
  const remaining = await countIncludedReleasesOnRun(tx, payrollRunId, employeeId);
  if (remaining > 0) {
    return;
  }

  const line = await tx.salaryLine.findUnique({
    where: { payrollRunId_employeeId: { payrollRunId, employeeId } },
  });
  if (line == null) {
    return;
  }

  await reversePayrollCarryAppliedOnSalaryLine(tx, {
    payrollRunId,
    payrollMonth,
    employeeId,
    line,
  });
}

/**
 * Reverts `INCLUDED_IN_PAYROLL` releases from salary lines (draft/review run only).
 * Releases return to `APPROVED` with `payrollRunId` cleared for re-attachment.
 * Consumed later-month carry is left as-is; remaining is not restored to the original.
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
  for (const releaseId of uniqueIds) {
    await tx.$queryRaw`SELECT id FROM bonus_releases WHERE id = ${releaseId} FOR UPDATE`;
  }
  const run = await loadPayrollRunForDetach(tx, payrollRunId);
  const releases = await loadReleasesForDetach(tx, uniqueIds);

  for (const rel of releases) {
    assertReleaseEligibleForDetach(rel, payrollRunId);
  }

  const employeesTouched = new Set<string>();
  for (const rel of releases) {
    employeesTouched.add(rel.employeeId);
    await removeReleaseFromSalaryLine(tx, payrollRunId, rel);
    await markReleaseDetached(tx, rel);
  }

  for (const employeeId of employeesTouched) {
    await reverseCarryIfLineEmpty(tx, payrollRunId, run.payrollMonth, employeeId);
  }

  await recalculatePayrollRunTotalsFromSalaryLines(tx, payrollRunId);
}
