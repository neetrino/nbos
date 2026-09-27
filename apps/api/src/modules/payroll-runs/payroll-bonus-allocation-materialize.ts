import { BadRequestException } from '@nestjs/common';
import { Decimal, type BonusReleaseTypeEnum, type TransactionClient } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';
import { payrollBonusReleaseBase } from './payroll-bonus-release-base';
import { sumBonusEntryReleasedBefore } from './payroll-bonus-entry-released-before';
import { resolveDraftAllocations } from './payroll-bonus-allocation-resolve';
import {
  assertPayrollAllocationExceptionReason,
  isEarlyProgressAllocation,
} from './payroll-allocation-exception-reason';
import type { PayrollAttachNotifyEvent } from './payroll-attach-notify.types';

type MaterializeTx = TransactionClient;

type AllocationDraft = Awaited<
  ReturnType<MaterializeTx['payrollBonusAllocationDraft']['findMany']>
>[number];

type MaterializeAllocation = {
  bonusEntryId: string;
  amount: Decimal;
  kind: string;
};

export type PayrollBonusAllocationMaterializeResult = {
  releaseIds: string[];
  carryNotifyEvents: PayrollAttachNotifyEvent[];
};

function releaseTypeForAllocation(kind: string, entryType: string): BonusReleaseTypeEnum {
  if (kind === 'EXTRA_BONUS') return 'EXTRA';
  if (kind === 'OVER_FUNDING') return 'OVER_FUNDING';
  if (kind === 'MANUAL_BONUS') return 'MANUAL';
  if (isEarlyProgressAllocation(kind, entryType)) return 'EARLY';
  return 'MANUAL';
}

function recordsAllocationActor(releaseType: BonusReleaseTypeEnum): boolean {
  return releaseType === 'EXTRA' || releaseType === 'OVER_FUNDING' || releaseType === 'EARLY';
}

async function readBonusEntryType(tx: MaterializeTx, bonusEntryId: string): Promise<string> {
  const entry = await tx.bonusEntry.findUnique({
    where: { id: bonusEntryId },
    select: { type: true },
  });
  if (!entry) throw new BadRequestException('Draft bonus entry not found');
  return entry.type;
}

async function assertWithinRemaining(
  tx: MaterializeTx,
  params: {
    bonusEntryId: string;
    payrollRunId: string;
    payrollMonth: string;
    amount: Decimal;
    kind: string;
  },
): Promise<void> {
  if (params.kind === 'EXTRA_BONUS' || params.kind === 'OVER_FUNDING') {
    return;
  }
  const entry = await tx.bonusEntry.findUnique({
    where: { id: params.bonusEntryId },
    select: { type: true, amount: true, payableAmount: true, earnedPeriod: true },
  });
  if (!entry) throw new BadRequestException('Draft bonus entry not found');
  const releases = await tx.bonusRelease.findMany({
    where: {
      bonusEntryId: params.bonusEntryId,
      status: { in: ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] },
    },
    select: { payrollRunId: true, status: true, amount: true, payrollIncludedAmount: true },
  });
  const remaining = Decimal.max(
    BONUS_POOL_ZERO,
    payrollBonusReleaseBase(entry, params.payrollMonth).minus(
      sumBonusEntryReleasedBefore(releases, params.payrollRunId),
    ),
  );
  if (params.amount.gt(remaining)) {
    throw new BadRequestException('Draft allocation exceeds remaining bonus amount');
  }
}

export async function materializePayrollBonusAllocationDrafts(
  tx: MaterializeTx,
  params: {
    payrollRunId: string;
    payrollMonth: string;
    actorUserId: string;
  },
): Promise<PayrollBonusAllocationMaterializeResult> {
  const drafts = await tx.payrollBonusAllocationDraft.findMany({
    where: { payrollRunId: params.payrollRunId },
    orderBy: { createdAt: 'asc' },
  });
  const releaseIds: string[] = [];
  let carryNotifyEvents: PayrollAttachNotifyEvent[] = [];

  for (const draft of drafts) {
    const materialized = await materializeOnePayrollBonusAllocationDraft(tx, draft, params);
    if (materialized == null) continue;
    releaseIds.push(...materialized.releaseIds);
    carryNotifyEvents = carryNotifyEvents.concat(materialized.events);
  }

  await tx.payrollBonusAllocationDraft.deleteMany({
    where: { payrollRunId: params.payrollRunId },
  });
  return { releaseIds, carryNotifyEvents };
}

async function materializeOnePayrollBonusAllocationDraft(
  tx: MaterializeTx,
  draft: AllocationDraft,
  params: { payrollRunId: string; payrollMonth: string; actorUserId: string },
): Promise<{ releaseIds: string[]; events: PayrollAttachNotifyEvent[] } | null> {
  const amount = decimalFrom(draft.amount);
  if (amount.lte(BONUS_POOL_ZERO)) return null;
  assertPayrollAllocationExceptionReason(draft.kind, draft.reason, null);
  const allocations = await resolveDraftAllocations(tx, draft, params, amount);
  const releaseIds: string[] = [];
  let events: PayrollAttachNotifyEvent[] = [];
  for (const allocation of allocations) {
    const created = await materializeOneAllocation(tx, draft, params, allocation);
    releaseIds.push(created.releaseId);
    events = events.concat(created.events);
  }
  return { releaseIds, events };
}

async function materializeOneAllocation(
  tx: MaterializeTx,
  draft: AllocationDraft,
  params: { payrollRunId: string; payrollMonth: string; actorUserId: string },
  allocation: MaterializeAllocation,
): Promise<{ releaseId: string; events: PayrollAttachNotifyEvent[] }> {
  await assertWithinRemaining(tx, {
    bonusEntryId: allocation.bonusEntryId,
    payrollRunId: params.payrollRunId,
    payrollMonth: params.payrollMonth,
    amount: allocation.amount,
    kind: allocation.kind,
  });
  const entryType =
    draft.kind === 'PROGRESS' ? await readBonusEntryType(tx, allocation.bonusEntryId) : '';
  assertPayrollAllocationExceptionReason(draft.kind, draft.reason, entryType || null);
  const releaseType = releaseTypeForAllocation(allocation.kind, entryType);
  assertPayrollAllocationExceptionReason(releaseType, draft.reason, entryType || null);
  return upsertApprovedAllocationRelease(tx, draft, {
    bonusEntryId: allocation.bonusEntryId,
    amount: allocation.amount,
    releaseType,
    actorUserId: params.actorUserId,
    payrollRunId: params.payrollRunId,
  });
}

async function findExistingAllocationRelease(
  tx: MaterializeTx,
  params: { bonusEntryId: string; payrollRunId: string; amount: Decimal },
): Promise<string | null> {
  const existing = await tx.bonusRelease.findFirst({
    where: {
      bonusEntryId: params.bonusEntryId,
      payrollRunId: params.payrollRunId,
      amount: params.amount,
      status: { in: ['APPROVED', 'INCLUDED_IN_PAYROLL'] },
    },
    select: { id: true },
  });
  return existing?.id ?? null;
}

async function upsertApprovedAllocationRelease(
  tx: MaterializeTx,
  draft: AllocationDraft,
  params: {
    bonusEntryId: string;
    amount: Decimal;
    releaseType: BonusReleaseTypeEnum;
    actorUserId: string;
    payrollRunId: string;
  },
): Promise<{ releaseId: string; events: PayrollAttachNotifyEvent[] }> {
  const existingId = await findExistingAllocationRelease(tx, params);
  const releaseId = existingId ?? (await createApprovedAllocationRelease(tx, draft, params));
  const events = await attachBonusReleasesToPayrollRun(tx, {
    payrollRunId: params.payrollRunId,
    releaseIds: [releaseId],
  });
  return { releaseId, events };
}

async function createApprovedAllocationRelease(
  tx: MaterializeTx,
  draft: AllocationDraft,
  params: {
    bonusEntryId: string;
    amount: Decimal;
    releaseType: BonusReleaseTypeEnum;
    actorUserId: string;
    payrollRunId: string;
  },
): Promise<string> {
  const order = await tx.order.findUnique({
    where: { id: draft.orderId },
    select: { productId: true, extensionId: true },
  });
  const release = await tx.bonusRelease.create({
    data: {
      bonusEntryId: params.bonusEntryId,
      employeeId: draft.employeeId,
      projectId: draft.projectId,
      productId: order?.productId ?? null,
      extensionId: order?.extensionId ?? null,
      amount: params.amount,
      releaseType: params.releaseType,
      reason: draft.reason,
      payrollRunId: params.payrollRunId,
      approvedById: recordsAllocationActor(params.releaseType) ? params.actorUserId : null,
      status: 'APPROVED',
    },
  });
  return release.id;
}
