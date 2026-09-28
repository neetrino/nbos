import { Decimal, type PrismaClient, type TransactionClient } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { applyPayableSnapshotToBonusEntry } from '../bonus/bonus-payable-snapshot';
import { earnedBonusPeriodForPayoutMonth } from './earned-sales-kpi-period';
import { ensurePayrollExtraBonusEntry } from './payroll-bonus-allocation-extra-entry';
import { sumBonusEntryReleasedBefore } from './payroll-bonus-entry-released-before';
import {
  isPayrollMatrixBonusEntryVisible,
  payrollBonusReleaseBase,
} from './payroll-bonus-release-base';
import {
  decodePayrollAllocationSourceAmounts,
  isOwnedPayrollAllocationSourceSplit,
  moneyAmount,
  payrollAllocationDraftDisplayTitle,
  type PayrollAllocationSourceAmount,
} from './payroll-allocation-source-amounts';

type ResolveTx = TransactionClient;

export type PayrollResolveDraft = {
  kind: string;
  title: string | null;
  bonusEntryId: string | null;
  employeeId: string;
  orderId: string;
  projectId: string;
  amount: Decimal;
};

export type PayrollResolveAllocation = {
  bonusEntryId: string;
  amount: Decimal;
  kind: string;
};

export async function ensureDraftBonusEntry(
  tx: ResolveTx,
  draft: PayrollResolveDraft,
  payrollMonth: string,
): Promise<string> {
  if (draft.bonusEntryId != null) {
    return draft.bonusEntryId;
  }
  const created = await tx.bonusEntry.create({
    data: {
      title: payrollAllocationDraftDisplayTitle(draft.title),
      employeeId: draft.employeeId,
      orderId: draft.orderId,
      projectId: draft.projectId,
      type: 'DELIVERY',
      amount: draft.amount,
      originalAmount: draft.amount,
      percent: BONUS_POOL_ZERO,
      status: 'ACTIVE',
      earnedPeriod: earnedBonusPeriodForPayoutMonth(payrollMonth),
    },
  });
  await applyPayableSnapshotToBonusEntry(tx as InstanceType<typeof PrismaClient>, created.id);
  return created.id;
}

export async function loadBonusEntryRemaining(
  tx: ResolveTx,
  params: { bonusEntryId: string; payrollRunId: string; payrollMonth: string },
): Promise<Decimal> {
  const entry = await tx.bonusEntry.findUnique({
    where: { id: params.bonusEntryId },
    select: { type: true, amount: true, payableAmount: true, earnedPeriod: true },
  });
  if (!entry) return BONUS_POOL_ZERO;
  const releases = await tx.bonusRelease.findMany({
    where: {
      bonusEntryId: params.bonusEntryId,
      status: { in: ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] },
    },
    select: { payrollRunId: true, status: true, amount: true, payrollIncludedAmount: true },
  });
  return Decimal.max(
    BONUS_POOL_ZERO,
    payrollBonusReleaseBase(entry, params.payrollMonth).minus(
      sumBonusEntryReleasedBefore(releases, params.payrollRunId),
    ),
  );
}

async function loadSplitEntryOwners(
  tx: ResolveTx,
  splits: PayrollAllocationSourceAmount[],
): Promise<Map<string, { employeeId: string; orderId: string }>> {
  const rows = await tx.bonusEntry.findMany({
    where: { id: { in: splits.map((split) => split.bonusEntryId) } },
    select: { id: true, employeeId: true, orderId: true },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

async function resolveOwnedSourceSplits(
  tx: ResolveTx,
  draft: PayrollResolveDraft,
  amount: Decimal,
): Promise<PayrollResolveAllocation[] | null> {
  if (draft.kind === 'MANUAL_BONUS') return null;
  const splits = decodePayrollAllocationSourceAmounts(draft.title);
  if (splits == null) return null;
  const owners = await loadSplitEntryOwners(tx, splits);
  if (
    !isOwnedPayrollAllocationSourceSplit({
      splits,
      draftAmount: amount,
      owners,
      employeeId: draft.employeeId,
      orderId: draft.orderId,
    })
  ) {
    return null;
  }
  return splits.map((split) => ({
    bonusEntryId: split.bonusEntryId,
    amount: split.amount,
    kind: draft.kind,
  }));
}

async function loadVisibleSourceEntries(
  tx: ResolveTx,
  draft: PayrollResolveDraft,
  payrollMonth: string,
): Promise<Array<{ id: string }>> {
  const rows = await tx.bonusEntry.findMany({
    where: { employeeId: draft.employeeId, orderId: draft.orderId },
    select: { id: true, type: true, amount: true, payableAmount: true, earnedPeriod: true },
  });
  return rows.filter((row) => isPayrollMatrixBonusEntryVisible(row, payrollMonth));
}

async function loadVisibleSourceRemainings(
  tx: ResolveTx,
  draft: PayrollResolveDraft,
  params: { payrollRunId: string; payrollMonth: string },
): Promise<Array<{ bonusEntryId: string; remaining: Decimal }>> {
  const visible = await loadVisibleSourceEntries(tx, draft, params.payrollMonth);
  const remainings: Array<{ bonusEntryId: string; remaining: Decimal }> = [];
  for (const entry of visible) {
    remainings.push({
      bonusEntryId: entry.id,
      remaining: moneyAmount(
        await loadBonusEntryRemaining(tx, {
          bonusEntryId: entry.id,
          payrollRunId: params.payrollRunId,
          payrollMonth: params.payrollMonth,
        }),
      ),
    });
  }
  return remainings;
}

function allocationsFromSourceRemainings(
  sources: Array<{ bonusEntryId: string; remaining: Decimal }>,
): PayrollResolveAllocation[] {
  return sources
    .filter((source) => source.remaining.gt(BONUS_POOL_ZERO))
    .map((source) => ({
      bonusEntryId: source.bonusEntryId,
      amount: source.remaining,
      kind: 'READY',
    }));
}

function orderBoundSourceFirst(
  sources: Array<{ bonusEntryId: string; remaining: Decimal }>,
  boundEntryId: string | null,
): Array<{ bonusEntryId: string; remaining: Decimal }> {
  if (boundEntryId == null) return sources;
  const bound = sources.filter((source) => source.bonusEntryId === boundEntryId);
  const rest = sources.filter((source) => source.bonusEntryId !== boundEntryId);
  return [...bound, ...rest];
}

/** Consumes visible source remainings up to `amount`; never invents EXTRA. */
function consumeSourceRemainingsUpTo(
  sources: Array<{ bonusEntryId: string; remaining: Decimal }>,
  amount: Decimal,
  boundEntryId: string | null,
): PayrollResolveAllocation[] {
  let left = moneyAmount(amount);
  const allocations: PayrollResolveAllocation[] = [];
  for (const source of orderBoundSourceFirst(sources, boundEntryId)) {
    if (left.lte(BONUS_POOL_ZERO) || source.remaining.lte(BONUS_POOL_ZERO)) {
      continue;
    }
    const take = moneyAmount(Decimal.min(source.remaining, left));
    allocations.push({ bonusEntryId: source.bonusEntryId, amount: take, kind: 'READY' });
    left = moneyAmount(left.minus(take));
  }
  return allocations;
}

async function appendExtraAllocation(
  tx: ResolveTx,
  draft: PayrollResolveDraft,
  params: { payrollRunId: string; payrollMonth: string },
  allocations: PayrollResolveAllocation[],
  excess: Decimal,
): Promise<PayrollResolveAllocation[]> {
  if (excess.lte(BONUS_POOL_ZERO)) return allocations;
  const extraId = await ensurePayrollExtraBonusEntry(
    tx,
    { ...draft, amount: excess },
    params.payrollMonth,
    params.payrollRunId,
  );
  allocations.push({ bonusEntryId: extraId, amount: excess, kind: 'EXTRA_BONUS' });
  return allocations;
}

/**
 * EXTRA is only max(0, cell − sum of per-source remaining). When the cell is at
 * or below that sum, consume remaining sources; never mark EXTRA on the bound
 * entry while another visible source still has remainder.
 */
async function resolveExtraOverflowAllocations(
  tx: ResolveTx,
  draft: PayrollResolveDraft,
  params: { payrollRunId: string; payrollMonth: string },
  amount: Decimal,
): Promise<PayrollResolveAllocation[]> {
  const sources = await loadVisibleSourceRemainings(tx, draft, params);
  const combined = moneyAmount(
    sources.reduce((sum, source) => sum.plus(source.remaining), BONUS_POOL_ZERO),
  );
  const cellAmount = moneyAmount(amount);
  const excess = moneyAmount(Decimal.max(BONUS_POOL_ZERO, cellAmount.minus(combined)));
  if (excess.lte(BONUS_POOL_ZERO)) {
    return consumeSourceRemainingsUpTo(sources, cellAmount, draft.bonusEntryId);
  }
  return appendExtraAllocation(tx, draft, params, allocationsFromSourceRemainings(sources), excess);
}

export async function resolveDraftAllocations(
  tx: ResolveTx,
  draft: PayrollResolveDraft,
  params: { payrollRunId: string; payrollMonth: string },
  amount: Decimal,
): Promise<PayrollResolveAllocation[]> {
  if (draft.kind === 'EXTRA_BONUS') {
    return resolveExtraOverflowAllocations(tx, draft, params, amount);
  }
  const splits = await resolveOwnedSourceSplits(tx, draft, amount);
  if (splits != null) return splits;
  const bonusEntryId = await ensureDraftBonusEntry(tx, draft, params.payrollMonth);
  return [{ bonusEntryId, amount, kind: draft.kind }];
}
