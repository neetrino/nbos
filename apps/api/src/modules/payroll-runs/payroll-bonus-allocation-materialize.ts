import { BadRequestException } from '@nestjs/common';
import {
  Decimal,
  type BonusReleaseTypeEnum,
  type PrismaClient,
  type TransactionClient,
} from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { applyPayableSnapshotToBonusEntry } from '../bonus/bonus-payable-snapshot';
import { earnedBonusPeriodForPayoutMonth } from './earned-sales-kpi-period';
import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';
import { payrollBonusReleaseBase } from './payroll-bonus-release-base';
import { sumBonusEntryReleasedBefore } from './payroll-bonus-entry-released-before';
import {
  assertPayrollAllocationExceptionReason,
  isEarlyProgressAllocation,
} from './payroll-allocation-exception-reason';
import type { PayrollAttachNotifyEvent } from './payroll-attach-notify.types';

type MaterializeTx = TransactionClient;

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

async function ensureDraftBonusEntry(
  tx: MaterializeTx,
  draft: {
    bonusEntryId: string | null;
    employeeId: string;
    orderId: string;
    projectId: string;
    amount: Decimal;
    title: string | null;
  },
  payrollMonth: string,
): Promise<string> {
  if (draft.bonusEntryId != null) {
    return draft.bonusEntryId;
  }
  const created = await tx.bonusEntry.create({
    data: {
      title: draft.title,
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
    releaseIds.push(materialized.releaseId);
    carryNotifyEvents = carryNotifyEvents.concat(materialized.events);
  }

  await tx.payrollBonusAllocationDraft.deleteMany({
    where: { payrollRunId: params.payrollRunId },
  });
  return { releaseIds, carryNotifyEvents };
}

async function materializeOnePayrollBonusAllocationDraft(
  tx: MaterializeTx,
  draft: Awaited<ReturnType<MaterializeTx['payrollBonusAllocationDraft']['findMany']>>[number],
  params: { payrollRunId: string; payrollMonth: string; actorUserId: string },
): Promise<{ releaseId: string; events: PayrollAttachNotifyEvent[] } | null> {
  const amount = decimalFrom(draft.amount);
  if (amount.lte(BONUS_POOL_ZERO)) return null;
  const bonusEntryId = await ensureDraftBonusEntry(tx, draft, params.payrollMonth);
  await assertWithinRemaining(tx, {
    bonusEntryId,
    payrollRunId: params.payrollRunId,
    payrollMonth: params.payrollMonth,
    amount,
    kind: draft.kind,
  });
  const entryType = draft.kind === 'PROGRESS' ? await readBonusEntryType(tx, bonusEntryId) : '';
  assertPayrollAllocationExceptionReason(draft.kind, draft.reason, entryType || null);
  const releaseType = releaseTypeForAllocation(draft.kind, entryType);
  assertPayrollAllocationExceptionReason(releaseType, draft.reason, entryType || null);
  return createApprovedAllocationRelease(tx, draft, {
    bonusEntryId,
    amount,
    releaseType,
    actorUserId: params.actorUserId,
    payrollRunId: params.payrollRunId,
  });
}

async function createApprovedAllocationRelease(
  tx: MaterializeTx,
  draft: Awaited<ReturnType<MaterializeTx['payrollBonusAllocationDraft']['findMany']>>[number],
  params: {
    bonusEntryId: string;
    amount: Decimal;
    releaseType: BonusReleaseTypeEnum;
    actorUserId: string;
    payrollRunId: string;
  },
): Promise<{ releaseId: string; events: PayrollAttachNotifyEvent[] }> {
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
      approvedById: draft.kind === 'OVER_FUNDING' ? params.actorUserId : null,
      status: 'APPROVED',
    },
  });
  const events = await attachBonusReleasesToPayrollRun(tx, {
    payrollRunId: params.payrollRunId,
    releaseIds: [release.id],
  });
  return { releaseId: release.id, events };
}
