import { BadRequestException } from '@nestjs/common';
import { type PrismaClient } from '@nbos/database';

import {
  applyPayableSnapshotToBonusEntry,
  computeAutoPayable,
  computePayableAmount,
  resolveBonusPayoutFactor,
} from './bonus-payable-snapshot';
import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

const COUNTING_STATUSES = ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] as const;

export type PatchBonusEntryPayableAdjustmentParams = {
  bonusEntryId: string;
  adjustment: string;
  reason: string;
};

export type PatchBonusEntryPayableAdjustmentResult = {
  bonusEntryId: string;
  projectId: string;
  orderId: string;
  employeeId: string;
  type: string;
  previousAdjustment: string;
  nextAdjustment: string;
  previousPayableAmount: string;
  nextPayableAmount: string;
  autoPayable: string;
};

export async function patchBonusEntryPayableAdjustment(
  prisma: InstanceType<typeof PrismaClient>,
  params: PatchBonusEntryPayableAdjustmentParams,
): Promise<PatchBonusEntryPayableAdjustmentResult> {
  const reason = params.reason.trim();
  if (reason.length === 0) {
    throw new BadRequestException('reason is required when editing payable adjustment');
  }

  const entry = await prisma.bonusEntry.findUnique({
    where: { id: params.bonusEntryId },
    select: {
      id: true,
      amount: true,
      payableAdjustment: true,
      payableAmount: true,
      projectId: true,
      orderId: true,
      employeeId: true,
      type: true,
      earnedPeriod: true,
    },
  });
  if (!entry) {
    throw new BadRequestException('Bonus entry not found');
  }

  const paidCount = await prisma.bonusRelease.count({
    where: { bonusEntryId: entry.id, status: 'PAID' },
  });
  if (paidCount > 0) {
    throw new BadRequestException('Payable adjustment cannot be edited after payment');
  }

  const releasedAgg = await prisma.bonusRelease.aggregate({
    where: {
      bonusEntryId: entry.id,
      status: { in: [...COUNTING_STATUSES] },
    },
    _sum: { amount: true },
  });
  const releasedTotal = decimalFrom(releasedAgg._sum.amount);
  const currentAdjustment = decimalFrom(entry.payableAdjustment);
  const nextAdjustment = decimalFrom(params.adjustment);
  if (nextAdjustment.equals(currentAdjustment)) {
    throw new BadRequestException('Payable adjustment is unchanged');
  }

  const factor = await resolveBonusPayoutFactor(prisma, {
    type: entry.type,
    employeeId: entry.employeeId,
    earnedPeriod: entry.earnedPeriod,
  });
  const autoPayable = computeAutoPayable(decimalFrom(entry.amount), factor);
  const nextPayable = computePayableAmount(autoPayable, nextAdjustment);
  if (nextPayable.lt(releasedTotal)) {
    throw new BadRequestException('Payable amount cannot be less than already released');
  }
  if (nextPayable.lte(BONUS_POOL_ZERO)) {
    throw new BadRequestException('Payable amount must be greater than zero');
  }

  const previousPayable =
    entry.payableAmount != null ? decimalFrom(entry.payableAmount) : autoPayable;

  await prisma.bonusEntry.update({
    where: { id: entry.id },
    data: { payableAdjustment: nextAdjustment },
  });
  await applyPayableSnapshotToBonusEntry(prisma, entry.id);
  await syncProductBonusPoolForOrder(prisma, entry.orderId);

  return {
    bonusEntryId: entry.id,
    projectId: entry.projectId,
    orderId: entry.orderId,
    employeeId: entry.employeeId,
    type: entry.type,
    previousAdjustment: currentAdjustment.toFixed(2),
    nextAdjustment: nextAdjustment.toFixed(2),
    previousPayableAmount: previousPayable.toFixed(2),
    nextPayableAmount: nextPayable.toFixed(2),
    autoPayable: autoPayable.toFixed(2),
  };
}
