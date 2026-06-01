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
import type { PayrollAttachNotifyEvent } from './payroll-attach-notify.types';

type MaterializeTx = TransactionClient;

export type PayrollBonusAllocationMaterializeResult = {
  releaseIds: string[];
  carryNotifyEvents: PayrollAttachNotifyEvent[];
};

function releaseTypeForKind(kind: string): BonusReleaseTypeEnum {
  if (kind === 'EXTRA_BONUS') return 'EXTRA';
  if (kind === 'OVER_FUNDING') return 'OVER_FUNDING';
  if (kind === 'MANUAL_BONUS') return 'MANUAL';
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
    const amount = decimalFrom(draft.amount);
    if (amount.lte(BONUS_POOL_ZERO)) continue;
    const bonusEntryId = await ensureDraftBonusEntry(tx, draft, params.payrollMonth);
    await assertWithinRemaining(tx, {
      bonusEntryId,
      payrollRunId: params.payrollRunId,
      payrollMonth: params.payrollMonth,
      amount,
      kind: draft.kind,
    });
    const order = await tx.order.findUnique({
      where: { id: draft.orderId },
      select: { productId: true, extensionId: true },
    });
    const release = await tx.bonusRelease.create({
      data: {
        bonusEntryId,
        employeeId: draft.employeeId,
        projectId: draft.projectId,
        productId: order?.productId ?? null,
        extensionId: order?.extensionId ?? null,
        amount,
        releaseType: releaseTypeForKind(draft.kind),
        reason: draft.reason,
        approvedById: draft.kind === 'OVER_FUNDING' ? params.actorUserId : null,
        status: 'APPROVED',
      },
    });
    releaseIds.push(release.id);
    carryNotifyEvents = carryNotifyEvents.concat(
      await attachBonusReleasesToPayrollRun(tx, {
        payrollRunId: params.payrollRunId,
        releaseIds: [release.id],
      }),
    );
  }

  await tx.payrollBonusAllocationDraft.deleteMany({
    where: { payrollRunId: params.payrollRunId },
  });
  return { releaseIds, carryNotifyEvents };
}
