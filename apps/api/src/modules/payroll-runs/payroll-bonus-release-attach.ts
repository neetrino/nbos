import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Decimal,
  type BonusTypeEnum,
  type PayrollRunStatusEnum,
  type TransactionClient,
} from '@nbos/database';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import { resolveSalaryLineStatus } from './payroll-salary-line-ledger-sync';
import { assertSalesBonusReadyForPayrollAttach } from '../bonus/resolve-sales-bonus-payable-at-attach';
import {
  applyPayrollBonusCap,
  resolveReattachIncludedAmount,
  resolveRememberedConsumedCarryFields,
} from './payroll-bonus-cap';
import { computePayrollIncludedBonusAmount } from './sales-kpi-payroll-payout';
import type { PayrollAttachNotifyEvent } from './payroll-attach-notify.types';
import { computeSalaryLineTotalPayable } from './payroll-salary-line-total-payable';
import { loadOrCreateBonusSettlementSalaryLine } from './payroll-bonus-settlement-salary-line';

const ATTACH_ALLOWED: PayrollRunStatusEnum[] = ['DRAFT', 'REVIEW'];

/** Minimal DB surface for attaching bonus releases (transaction or full client). */
export type BonusReleaseAttachTx = Pick<
  TransactionClient,
  | 'payrollRun'
  | 'bonusRelease'
  | 'bonusEntry'
  | 'salaryLine'
  | 'employee'
  | 'compensationProfile'
  | 'kpiPolicy'
  | 'kpiResult'
  | 'payment'
>;

export interface AttachBonusReleasesParams {
  payrollRunId: string;
  releaseIds: string[];
}

type AttachReleaseRow = {
  id: string;
  employeeId: string;
  amount: Decimal;
  status: string;
  payrollRunId: string | null;
  releaseType: string;
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: Decimal | null;
  bonusEntry: { id: string; type: BonusTypeEnum; order: { code: string } };
};

type SalaryLineAttachSnapshot = {
  id: string;
  baseSalary: Decimal;
  bonusesTotal: Decimal;
  paidAmount: Decimal;
};

function assertAttachAllowed(status: PayrollRunStatusEnum): void {
  if (!ATTACH_ALLOWED.includes(status)) {
    throw new BadRequestException(
      `Bonus releases can only be attached while the payroll run is DRAFT or REVIEW (current: ${status}).`,
    );
  }
}

function assertReleaseEligibleForAttach(rel: AttachReleaseRow, payrollRunId: string): void {
  if (rel.status === 'INCLUDED_IN_PAYROLL' && rel.payrollRunId === payrollRunId) {
    return;
  }
  if (rel.status !== 'APPROVED') {
    throw new BadRequestException(
      `Bonus release ${rel.id} is not in APPROVED status (current: ${rel.status}).`,
    );
  }
  if (rel.payrollRunId != null && rel.payrollRunId !== payrollRunId) {
    throw new BadRequestException(`Bonus release ${rel.id} is bound to a different payroll run.`);
  }
}

async function loadSalaryLineForAttach(
  tx: BonusReleaseAttachTx,
  payrollRunId: string,
  employeeId: string,
  payrollMonth: string,
): Promise<SalaryLineAttachSnapshot> {
  return loadOrCreateBonusSettlementSalaryLine(tx, {
    payrollRunId,
    employeeId,
    payrollMonth,
  });
}

async function includeReleaseOnSalaryLine(
  tx: BonusReleaseAttachTx,
  line: SalaryLineAttachSnapshot,
  included: Decimal,
): Promise<void> {
  const nextBonuses = line.bonusesTotal.plus(included);
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

async function loadPayrollRunForAttach(
  tx: BonusReleaseAttachTx,
  payrollRunId: string,
): Promise<{ id: string; status: PayrollRunStatusEnum; payrollMonth: string }> {
  const run = await tx.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: { id: true, status: true, payrollMonth: true },
  });
  if (!run) {
    throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
  }
  assertAttachAllowed(run.status);
  return run;
}

async function loadReleasesForAttach(
  tx: BonusReleaseAttachTx,
  uniqueIds: string[],
): Promise<AttachReleaseRow[]> {
  const releases = await tx.bonusRelease.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      employeeId: true,
      amount: true,
      status: true,
      payrollRunId: true,
      releaseType: true,
      payrollCarryOverAmount: true,
      payrollCarryOverRemaining: true,
      bonusEntry: {
        select: { id: true, type: true, order: { select: { code: true } } },
      },
    },
  });
  if (releases.length !== uniqueIds.length) {
    throw new BadRequestException('One or more bonus release ids were not found.');
  }
  return releases;
}

function includedAmountForAttach(
  rel: AttachReleaseRow,
  currentBonusesTotal: Decimal,
  baseSalary: Decimal,
): Decimal {
  const releaseAmount = computePayrollIncludedBonusAmount({
    releaseAmount: rel.amount,
    bonusType: rel.bonusEntry.type,
    kpiFactor: new Decimal(1),
  });
  const scaled = applyPayrollBonusCap({
    kpiScaledAmount: releaseAmount,
    currentBonusesTotal,
    baseSalary,
  }).payrollIncludedAmount;
  return resolveReattachIncludedAmount({
    kpiScaledAmount: scaled,
    payrollCarryOverAmount: rel.payrollCarryOverAmount,
    payrollCarryOverRemaining: rel.payrollCarryOverRemaining,
  });
}

async function attachOneApprovedRelease(
  tx: BonusReleaseAttachTx,
  payrollRunId: string,
  payrollMonth: string,
  rel: AttachReleaseRow,
): Promise<void> {
  const line = await loadSalaryLineForAttach(tx, payrollRunId, rel.employeeId, payrollMonth);

  if (rel.bonusEntry.type === 'SALES') {
    await assertSalesBonusReadyForPayrollAttach(tx, {
      bonusEntryId: rel.bonusEntry.id,
      payrollMonth,
      releaseAmount: rel.amount,
      releaseType: rel.releaseType,
    });
  }

  const included = includedAmountForAttach(rel, line.bonusesTotal, line.baseSalary);
  const remembered = resolveRememberedConsumedCarryFields({
    payrollCarryOverAmount: rel.payrollCarryOverAmount,
    payrollCarryOverRemaining: rel.payrollCarryOverRemaining,
  });

  await includeReleaseOnSalaryLine(tx, line, included);
  await tx.bonusRelease.update({
    where: { id: rel.id },
    data: {
      status: 'INCLUDED_IN_PAYROLL',
      payrollRunId,
      payrollIncludedAmount: included,
      kpiBurnedAmount: null,
      kpiBurnedReason: null,
      payrollCarryOverAmount: remembered.payrollCarryOverAmount,
      payrollCarryOverRemaining: remembered.payrollCarryOverRemaining,
    },
  });
}

/**
 * Moves approved bonus releases into a draft/review payroll run: bumps `SalaryLine.bonusesTotal`
 * and marks each release `INCLUDED_IN_PAYROLL`. Other releases' unpaid carry stays stored.
 * This release's unpaid remaining is folded into the included amount.
 * Consumed later-month carry is remembered as amount + null remaining.
 */
export async function attachBonusReleasesToPayrollRun(
  tx: BonusReleaseAttachTx,
  params: AttachBonusReleasesParams,
): Promise<PayrollAttachNotifyEvent[]> {
  const { payrollRunId, releaseIds } = params;
  if (releaseIds.length === 0) {
    throw new BadRequestException('releaseIds must be non-empty');
  }

  const uniqueIds = [...new Set(releaseIds)];
  const run = await loadPayrollRunForAttach(tx, payrollRunId);
  const releases = await loadReleasesForAttach(tx, uniqueIds);

  for (const rel of releases) {
    assertReleaseEligibleForAttach(rel, payrollRunId);
  }

  const releasesToAttach = releases.filter(
    (r) => !(r.status === 'INCLUDED_IN_PAYROLL' && r.payrollRunId === payrollRunId),
  );
  if (releasesToAttach.length === 0) {
    await recalculatePayrollRunTotalsFromSalaryLines(tx, payrollRunId);
    return [];
  }

  for (const rel of releasesToAttach) {
    await attachOneApprovedRelease(tx, payrollRunId, run.payrollMonth, rel);
  }

  await recalculatePayrollRunTotalsFromSalaryLines(tx, payrollRunId);
  return [];
}
