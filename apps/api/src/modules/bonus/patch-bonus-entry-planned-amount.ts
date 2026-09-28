import { BadRequestException } from '@nestjs/common';
import { Decimal, type PrismaClient } from '@nbos/database';
import { DELIVERY_BONUS_SOURCE_V2 } from '@nbos/shared';
import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';
import { applyPayableSnapshotToBonusEntry } from './bonus-payable-snapshot';
import {
  assertOrdinaryCountingWithinSalesPayable,
  sumOrdinaryCountingReleases,
} from './bonus-release-entry-cap';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

const COUNTING_STATUSES = ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] as const;

export type PatchBonusEntryPlannedAmountParams = {
  bonusEntryId: string;
  amount: string;
  title?: string;
  reason: string;
};

export type PatchBonusEntryPlannedAmountResult = {
  bonusEntryId: string;
  projectId: string;
  orderId: string;
  employeeId: string;
  type: string;
  earnedPeriod: string | null;
  previousAmount: string;
  nextAmount: string;
  previousTitle: string | null;
};

type PlannedAmountEntry = {
  id: string;
  amount: Decimal;
  originalAmount: Decimal | null;
  title: string | null;
  projectId: string;
  orderId: string;
  employeeId: string;
  type: string;
  earnedPeriod: string | null;
  deliverySource: string | null;
};

/** Preserve first amount as `originalAmount` when Finance edits planned bonus. */
export function resolvePlannedAmountFields(
  currentAmount: Decimal,
  nextAmount: Decimal,
  existingOriginal: Decimal | null,
): { amount: Decimal; originalAmount: Decimal } {
  if (nextAmount.lte(BONUS_POOL_ZERO)) {
    throw new BadRequestException('Planned amount must be greater than zero');
  }
  if (nextAmount.equals(currentAmount)) {
    throw new BadRequestException('Planned amount is unchanged');
  }
  return {
    amount: nextAmount,
    originalAmount: existingOriginal ?? currentAmount,
  };
}

async function assertSalesOrdinaryFitAfterSnapshot(
  db: Pick<InstanceType<typeof PrismaClient>, 'bonusEntry' | 'bonusRelease'>,
  bonusEntryId: string,
  type: string,
): Promise<void> {
  if (type !== 'SALES') {
    return;
  }
  const snapshotted = await db.bonusEntry.findUnique({
    where: { id: bonusEntryId },
    select: { payableAmount: true },
  });
  const ordinaryTotal = await sumOrdinaryCountingReleases(db, bonusEntryId);
  assertOrdinaryCountingWithinSalesPayable(
    ordinaryTotal,
    snapshotted?.payableAmount ?? null,
    'Sales bonus',
  );
}

async function loadEntryForPlannedAmountPatch(
  prisma: InstanceType<typeof PrismaClient>,
  bonusEntryId: string,
): Promise<PlannedAmountEntry> {
  const entry = await prisma.bonusEntry.findUnique({
    where: { id: bonusEntryId },
    select: {
      id: true,
      amount: true,
      originalAmount: true,
      title: true,
      projectId: true,
      orderId: true,
      employeeId: true,
      type: true,
      earnedPeriod: true,
      deliverySource: true,
    },
  });
  if (!entry) {
    throw new BadRequestException('Bonus entry not found');
  }
  if (entry.deliverySource === DELIVERY_BONUS_SOURCE_V2) {
    throw new BadRequestException('V2 generated delivery entries cannot be patched here');
  }
  return entry;
}

async function assertPlannedAmountAboveReleased(
  prisma: InstanceType<typeof PrismaClient>,
  bonusEntryId: string,
  nextAmount: Decimal,
): Promise<void> {
  const paidCount = await prisma.bonusRelease.count({
    where: { bonusEntryId, status: 'PAID' },
  });
  if (paidCount > 0) {
    throw new BadRequestException('Planned bonus cannot be edited after payment');
  }
  const releasedAgg = await prisma.bonusRelease.aggregate({
    where: {
      bonusEntryId,
      status: { in: [...COUNTING_STATUSES] },
    },
    _sum: { amount: true },
  });
  if (nextAmount.lt(decimalFrom(releasedAgg._sum.amount))) {
    throw new BadRequestException('Planned amount cannot be less than already released');
  }
}

async function persistPlannedAmountAndSnapshot(
  prisma: InstanceType<typeof PrismaClient>,
  entry: PlannedAmountEntry,
  fields: { amount: Decimal; originalAmount: Decimal },
  title: string | undefined,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.bonusEntry.update({
      where: { id: entry.id },
      data: {
        amount: fields.amount,
        originalAmount: fields.originalAmount,
        ...(title && title.length > 0 ? { title } : {}),
      },
    });
    await applyPayableSnapshotToBonusEntry(tx, entry.id);
    await assertSalesOrdinaryFitAfterSnapshot(tx, entry.id, entry.type);
  });
}

export async function patchBonusEntryPlannedAmount(
  prisma: InstanceType<typeof PrismaClient>,
  params: PatchBonusEntryPlannedAmountParams,
): Promise<PatchBonusEntryPlannedAmountResult> {
  const reason = params.reason.trim();
  if (reason.length === 0) {
    throw new BadRequestException('reason is required when editing planned bonus');
  }

  const entry = await loadEntryForPlannedAmountPatch(prisma, params.bonusEntryId);
  const currentAmount = decimalFrom(entry.amount);
  const nextAmount = decimalFrom(params.amount);
  await assertPlannedAmountAboveReleased(prisma, entry.id, nextAmount);

  const fields = resolvePlannedAmountFields(
    currentAmount,
    nextAmount,
    entry.originalAmount ? decimalFrom(entry.originalAmount) : null,
  );
  await persistPlannedAmountAndSnapshot(prisma, entry, fields, params.title?.trim());
  await syncProductBonusPoolForOrder(prisma, entry.orderId);

  return {
    bonusEntryId: entry.id,
    projectId: entry.projectId,
    orderId: entry.orderId,
    employeeId: entry.employeeId,
    type: entry.type,
    earnedPeriod: entry.earnedPeriod,
    previousAmount: currentAmount.toFixed(2),
    nextAmount: fields.amount.toFixed(2),
    previousTitle: entry.title,
  };
}
