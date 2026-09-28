import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import {
  isPayrollMatrixBonusEntryVisible,
  payrollBonusReleaseBase,
} from './payroll-bonus-release-base';
import {
  sumBonusEntryReleasedBefore,
  type PayrollBonusReleaseLedgerRow,
} from './payroll-bonus-entry-released-before';
import { remainingForBonusEntry } from './payroll-allocation-source-amounts';
import type { PayrollAllocationMatrixCellSource } from './payroll-allocation-matrix.types';

export type PayrollMatrixCellSourceInput = {
  id: string;
  employeeId: string;
  title?: string | null;
  type: string;
  amount: Decimal | string | number;
  originalAmount?: Decimal | string | number | null;
  payableAmount: Decimal | string | number | null;
  earnedPeriod: string | null;
  dealId?: string | null;
  salesAccrualInvoiceId?: string | null;
  calculationSnapshot?: unknown;
};

export type PayrollMatrixCellSourceRelease = PayrollBonusReleaseLedgerRow & {
  id?: string;
  bonusEntryId?: string;
};

export type PayrollMatrixCellSourceAggregate = {
  visibleEntries: PayrollMatrixCellSourceInput[];
  firstEntry: PayrollMatrixCellSourceInput | null;
  sourceEntries: PayrollAllocationMatrixCellSource[];
  planned: Decimal;
  original: Decimal | null;
  releasedBefore: Decimal;
  paidBefore: Decimal;
  remaining: Decimal;
  thisRunReleaseAmount: Decimal;
  thisRunReleaseId: string | null;
};

function moneyText(value: Decimal): string {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function entryOriginalAmount(entry: PayrollMatrixCellSourceInput): Decimal {
  return entry.originalAmount != null
    ? decimalFrom(entry.originalAmount)
    : decimalFrom(entry.amount);
}

export function visiblePayrollMatrixCellEntries<T extends PayrollMatrixCellSourceInput>(
  entries: T[],
  employeeId: string,
  payrollMonth: string,
): T[] {
  return entries.filter(
    (entry) =>
      entry.employeeId === employeeId && isPayrollMatrixBonusEntryVisible(entry, payrollMonth),
  );
}

export function sumPayrollMatrixCellPlanned(
  entries: PayrollMatrixCellSourceInput[],
  payrollMonth: string,
): Decimal {
  return entries.reduce(
    (sum, entry) => sum.plus(payrollBonusReleaseBase(entry, payrollMonth)),
    BONUS_POOL_ZERO,
  );
}

export function mapPayrollMatrixCellSourceEntries(
  entries: PayrollMatrixCellSourceInput[],
  params: {
    payrollMonth: string;
    payrollRunId: string;
    releases: PayrollMatrixCellSourceRelease[];
  },
): PayrollAllocationMatrixCellSource[] {
  return entries.map((entry) => {
    const remaining = remainingForBonusEntry({
      entry,
      releases: params.releases,
      payrollMonth: params.payrollMonth,
      payrollRunId: params.payrollRunId,
    });
    return {
      bonusEntryId: entry.id,
      plannedAmount: moneyText(payrollBonusReleaseBase(entry, params.payrollMonth)),
      originalAmount: moneyText(entryOriginalAmount(entry)),
      remainingAmount: moneyText(remaining),
      includedThisMonth: moneyText(
        includedThisRunAmount(params.releases, entry.id, params.payrollRunId),
      ),
      title: entry.title ?? null,
      type: entry.type,
    };
  });
}

function includedThisRunAmount(
  releases: PayrollMatrixCellSourceRelease[],
  entryId: string,
  payrollRunId: string,
): Decimal {
  return releases.reduce((sum, release) => {
    if (release.bonusEntryId !== entryId) return sum;
    if (release.payrollRunId !== payrollRunId) return sum;
    if (release.status !== 'INCLUDED_IN_PAYROLL') return sum;
    return sum.plus(decimalFrom(release.payrollIncludedAmount ?? release.amount));
  }, BONUS_POOL_ZERO);
}

function filterReleasesForVisibleSources(
  releases: PayrollMatrixCellSourceRelease[],
  visibleIds: Set<string>,
): PayrollMatrixCellSourceRelease[] {
  if (visibleIds.size === 0) return releases;
  return releases.filter((release) => {
    if (release.bonusEntryId == null) return true;
    return visibleIds.has(release.bonusEntryId);
  });
}

function sumThisRunIncludedReleases(
  releases: PayrollMatrixCellSourceRelease[],
  payrollRunId: string,
): { amount: Decimal; firstId: string | null } {
  const thisRun = releases.filter(
    (release) => release.payrollRunId === payrollRunId && release.status === 'INCLUDED_IN_PAYROLL',
  );
  const amount = thisRun.reduce(
    (sum, release) => sum.plus(decimalFrom(release.payrollIncludedAmount ?? release.amount)),
    BONUS_POOL_ZERO,
  );
  return { amount, firstId: thisRun[0]?.id ?? null };
}

function sumPaidBefore(releases: PayrollMatrixCellSourceRelease[]): Decimal {
  return releases
    .filter((release) => release.status === 'PAID')
    .reduce(
      (sum, release) => sum.plus(decimalFrom(release.payrollIncludedAmount ?? release.amount)),
      BONUS_POOL_ZERO,
    );
}

export function payrollMatrixCellRemaining(planned: Decimal, releasedBefore: Decimal): Decimal {
  return Decimal.max(BONUS_POOL_ZERO, planned.minus(releasedBefore));
}

export function resolvePayrollMatrixVisibleSourceRemaining(params: {
  entries: PayrollMatrixCellSourceInput[];
  payrollMonth: string;
  payrollRunId: string;
  releases: PayrollBonusReleaseLedgerRow[];
}): { planned: Decimal; remaining: Decimal } {
  const planned = sumPayrollMatrixCellPlanned(params.entries, params.payrollMonth);
  const releasedBefore = sumBonusEntryReleasedBefore(params.releases, params.payrollRunId);
  return {
    planned,
    remaining: payrollMatrixCellRemaining(planned, releasedBefore),
  };
}

export function isPayrollMatrixManualBonusEntry(
  entry: Pick<
    PayrollMatrixCellSourceInput,
    'dealId' | 'salesAccrualInvoiceId' | 'calculationSnapshot'
  >,
): boolean {
  return (
    entry.dealId == null && entry.salesAccrualInvoiceId == null && entry.calculationSnapshot == null
  );
}

export function payrollMatrixCellIsManualBonus(
  entries: PayrollMatrixCellSourceInput[],
  draft: { bonusEntryId: string | null } | undefined,
): boolean {
  if (draft != null && draft.bonusEntryId == null) return true;
  return entries.length > 0 && entries.every(isPayrollMatrixManualBonusEntry);
}

export function aggregatePayrollMatrixCellSources(params: {
  entries: PayrollMatrixCellSourceInput[];
  employeeId: string;
  payrollMonth: string;
  payrollRunId: string;
  releases: PayrollMatrixCellSourceRelease[];
}): PayrollMatrixCellSourceAggregate {
  const visible = visiblePayrollMatrixCellEntries(
    params.entries,
    params.employeeId,
    params.payrollMonth,
  );
  const scopedReleases = filterReleasesForVisibleSources(
    params.releases,
    new Set(visible.map((entry) => entry.id)),
  );
  const planned = sumPayrollMatrixCellPlanned(visible, params.payrollMonth);
  const releasedBefore = sumBonusEntryReleasedBefore(scopedReleases, params.payrollRunId);
  const thisRun = sumThisRunIncludedReleases(scopedReleases, params.payrollRunId);
  const original =
    visible.length === 0
      ? null
      : visible.reduce((sum, entry) => sum.plus(entryOriginalAmount(entry)), BONUS_POOL_ZERO);
  return {
    visibleEntries: visible,
    firstEntry: visible[0] ?? null,
    sourceEntries: mapPayrollMatrixCellSourceEntries(visible, {
      payrollMonth: params.payrollMonth,
      payrollRunId: params.payrollRunId,
      releases: scopedReleases,
    }),
    planned,
    original,
    releasedBefore,
    paidBefore: sumPaidBefore(scopedReleases),
    remaining: payrollMatrixCellRemaining(planned, releasedBefore),
    thisRunReleaseAmount: thisRun.amount,
    thisRunReleaseId: thisRun.firstId,
  };
}
