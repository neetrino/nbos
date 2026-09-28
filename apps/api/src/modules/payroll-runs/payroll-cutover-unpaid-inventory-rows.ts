import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { moneyAmount, moneyText } from './payroll-allocation-source-amounts';
import { decodePayrollCashRefundNotes } from './payroll-salary-first-cash-reverse';
import {
  attributedCashForEntry,
  includedReleasePlanned,
  includedRemainingForRelease,
  isIncludedOnOpenRun,
  leftoverUnconsumedCarry,
  listedElsewhereForEntry,
  remainingAfterCash,
} from './payroll-cutover-unpaid-inventory-remaining';
import type {
  CutoverBonusEntrySnapshot,
  CutoverBonusReleaseSnapshot,
  CutoverPaymentSnapshot,
  CutoverSalaryLineSnapshot,
  CutoverUnpaidInventoryRow,
} from './payroll-cutover-unpaid-inventory.types';

export function unpaidBonusRows(
  entries: readonly CutoverBonusEntrySnapshot[],
  releases: readonly CutoverBonusReleaseSnapshot[],
  attributed: ReadonlyMap<string, Decimal>,
): CutoverUnpaidInventoryRow[] {
  const rows: CutoverUnpaidInventoryRow[] = [];
  const listedElsewhere = listedElsewhereForEntry(entries, releases, attributed);
  for (const entry of entries) {
    const planned = moneyAmount(entry.amount);
    const paid = attributedCashForEntry(entry.id, releases, attributed);
    const remaining = remainingAfterCash(
      remainingAfterCash(planned, paid),
      listedElsewhere.get(entry.id) ?? BONUS_POOL_ZERO,
    );
    if (remaining.lte(BONUS_POOL_ZERO)) {
      continue;
    }
    rows.push(
      explainableRow({
        kind: 'UNPAID_BONUS',
        sourceId: entry.id,
        employeeId: entry.employeeId,
        earnedPeriod: entry.earnedPeriod,
        status: entry.status,
        amount: remaining,
        plannedAmount: planned,
        attributedPaidCash: paid,
        explanation: unpaidBonusExplanation(entry, remaining, planned, paid),
      }),
    );
  }
  return rows;
}

export function includedUnpaidReleaseRows(
  releases: readonly CutoverBonusReleaseSnapshot[],
  attributed: ReadonlyMap<string, Decimal>,
): CutoverUnpaidInventoryRow[] {
  const rows: CutoverUnpaidInventoryRow[] = [];
  for (const release of releases) {
    if (!isIncludedOnOpenRun(release)) {
      continue;
    }
    const planned = includedReleasePlanned(release);
    const paid = moneyAmount(attributed.get(release.id) ?? BONUS_POOL_ZERO);
    const remaining = includedRemainingForRelease(release, attributed);
    if (remaining.lte(BONUS_POOL_ZERO)) {
      continue;
    }
    rows.push(
      explainableRow({
        kind: 'INCLUDED_UNPAID_RELEASE',
        sourceId: release.id,
        employeeId: release.employeeId,
        earnedPeriod: release.payrollRun?.payrollMonth ?? null,
        status: release.status,
        amount: remaining,
        plannedAmount: planned,
        attributedPaidCash: paid,
        explanation: includedReleaseExplanation(release, remaining, planned, paid),
      }),
    );
  }
  return rows;
}

export function leftoverSalaryCapCarryRows(
  releases: readonly CutoverBonusReleaseSnapshot[],
): CutoverUnpaidInventoryRow[] {
  const rows: CutoverUnpaidInventoryRow[] = [];
  for (const release of releases) {
    const leftover = leftoverUnconsumedCarry(release);
    if (leftover.lte(BONUS_POOL_ZERO)) {
      continue;
    }
    rows.push(
      explainableRow({
        kind: 'LEFTOVER_SALARY_CAP_CARRY',
        sourceId: release.id,
        employeeId: release.employeeId,
        earnedPeriod: release.payrollRun?.payrollMonth ?? null,
        status: release.status,
        amount: leftover,
        plannedAmount: moneyAmount(release.payrollCarryOverAmount ?? BONUS_POOL_ZERO),
        attributedPaidCash: null,
        explanation:
          `Leftover salary-cap carry ${moneyText(leftover)} is remembered and was not consumed. ` +
          'Do not pay it and do not delete it.',
      }),
    );
  }
  return rows;
}

export function unappliedRefundResidualRows(
  payments: readonly CutoverPaymentSnapshot[],
  salaryLines: readonly CutoverSalaryLineSnapshot[],
): CutoverUnpaidInventoryRow[] {
  const rows: CutoverUnpaidInventoryRow[] = [];
  const appliedSources = new Set<string>();
  const employeeByExpenseId = employeeIdByExpense(salaryLines);
  for (const payment of payments) {
    const residual = residualOnPayment(payment, appliedSources);
    if (residual == null) {
      continue;
    }
    rows.push(
      explainableRow({
        kind: 'UNAPPLIED_REFUND_RESIDUAL',
        sourceId: payment.id,
        employeeId: employeeByExpenseId.get(payment.expenseId) ?? '',
        earnedPeriod: null,
        status: 'UNAPPLIED_RESIDUAL',
        amount: residual,
        plannedAmount: null,
        attributedPaidCash: null,
        explanation:
          `Unapplied refund residual ${moneyText(residual)} is stored on payroll cash refund notes. ` +
          'List it separately from bonus remaining. Do not take it from fixed salary.',
      }),
    );
  }
  return rows;
}

export function alreadySettledSalaryRows(
  salaryLines: readonly CutoverSalaryLineSnapshot[],
): CutoverUnpaidInventoryRow[] {
  const rows: CutoverUnpaidInventoryRow[] = [];
  for (const line of salaryLines) {
    if (!isAlreadySettledSalary(line)) {
      continue;
    }
    const paid = moneyAmount(line.paidAmount);
    rows.push(
      explainableRow({
        kind: 'ALREADY_SETTLED',
        sourceId: line.id,
        employeeId: line.employeeId,
        earnedPeriod: null,
        status: line.status,
        amount: paid,
        plannedAmount: moneyAmount(paid.plus(line.remainingAmount)),
        attributedPaidCash: paid,
        explanation:
          `Already settled ${line.status} salary ${moneyText(paid)}. ` +
          'Not offered as unpaid again.',
      }),
    );
  }
  return rows;
}

function residualOnPayment(
  payment: CutoverPaymentSnapshot,
  appliedSources: Set<string>,
): Decimal | null {
  const refund = decodePayrollCashRefundNotes(payment.notes);
  if (refund == null || appliedSources.has(refund.sourcePaymentId)) {
    return null;
  }
  appliedSources.add(refund.sourcePaymentId);
  const residual = moneyAmount(refund.residualAmount);
  return residual.gt(BONUS_POOL_ZERO) ? residual : null;
}

function isAlreadySettledSalary(line: CutoverSalaryLineSnapshot): boolean {
  if (line.status === 'PAID') {
    return true;
  }
  return line.payrollRun.status === 'CLOSED' && moneyAmount(line.remainingAmount).lte(0);
}

function employeeIdByExpense(
  salaryLines: readonly CutoverSalaryLineSnapshot[],
): Map<string, string> {
  const byExpense = new Map<string, string>();
  for (const line of salaryLines) {
    if (line.expenseId != null && line.expenseId.length > 0) {
      byExpense.set(line.expenseId, line.employeeId);
    }
  }
  return byExpense;
}

function unpaidBonusExplanation(
  entry: CutoverBonusEntrySnapshot,
  remaining: Decimal,
  planned: Decimal,
  paid: Decimal,
): string {
  return (
    `Unpaid bonus remaining ${moneyText(remaining)} for employee ${entry.employeeId}` +
    `${earnedPeriodClause(entry.earnedPeriod)}. ` +
    `Planned ${moneyText(planned)} minus attributed paid cash ${moneyText(paid)}, not status-only.`
  );
}

function includedReleaseExplanation(
  release: CutoverBonusReleaseSnapshot,
  remaining: Decimal,
  planned: Decimal,
  paid: Decimal,
): string {
  return (
    `Included unpaid release remaining ${moneyText(remaining)} ` +
    `(${moneyText(planned)} minus attributed cash ${moneyText(paid)}) ` +
    `on an open run, status ${release.status}.`
  );
}

function earnedPeriodClause(earnedPeriod: string | null): string {
  if (earnedPeriod == null || earnedPeriod.length === 0) {
    return '';
  }
  return `, earned ${earnedPeriod}`;
}

function explainableRow(row: CutoverUnpaidInventoryRow): CutoverUnpaidInventoryRow {
  return row;
}
