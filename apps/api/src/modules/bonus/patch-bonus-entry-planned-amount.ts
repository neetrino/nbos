import { BadRequestException } from '@nestjs/common';
import { Decimal, type PrismaClient } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';
import { refreshSalesBonusesForEmployeesEarnedMonth } from './sales-bonus-kpi-payable';

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

export async function patchBonusEntryPlannedAmount(
  prisma: InstanceType<typeof PrismaClient>,
  params: PatchBonusEntryPlannedAmountParams,
): Promise<PatchBonusEntryPlannedAmountResult> {
  const reason = params.reason.trim();
  if (reason.length === 0) {
    throw new BadRequestException('reason is required when editing planned bonus');
  }

  const entry = await prisma.bonusEntry.findUnique({
    where: { id: params.bonusEntryId },
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
    },
  });
  if (!entry) {
    throw new BadRequestException('Bonus entry not found');
  }

  const paidCount = await prisma.bonusRelease.count({
    where: { bonusEntryId: entry.id, status: 'PAID' },
  });
  if (paidCount > 0) {
    throw new BadRequestException('Planned bonus cannot be edited after payment');
  }

  const releasedAgg = await prisma.bonusRelease.aggregate({
    where: {
      bonusEntryId: entry.id,
      status: { in: [...COUNTING_STATUSES] },
    },
    _sum: { amount: true },
  });
  const releasedTotal = decimalFrom(releasedAgg._sum.amount);
  const currentAmount = decimalFrom(entry.amount);
  const nextAmount = decimalFrom(params.amount);

  if (nextAmount.lt(releasedTotal)) {
    throw new BadRequestException('Planned amount cannot be less than already released');
  }

  const { amount, originalAmount } = resolvePlannedAmountFields(
    currentAmount,
    nextAmount,
    entry.originalAmount ? decimalFrom(entry.originalAmount) : null,
  );

  const title = params.title?.trim();
  await prisma.bonusEntry.update({
    where: { id: entry.id },
    data: {
      amount,
      originalAmount,
      ...(title && title.length > 0 ? { title } : {}),
    },
  });

  await syncProductBonusPoolForOrder(prisma, entry.orderId);

  if (entry.type === 'SALES' && entry.earnedPeriod) {
    await refreshSalesBonusesForEmployeesEarnedMonth(
      prisma,
      [entry.employeeId],
      entry.earnedPeriod,
    );
  }

  return {
    bonusEntryId: entry.id,
    projectId: entry.projectId,
    orderId: entry.orderId,
    employeeId: entry.employeeId,
    type: entry.type,
    earnedPeriod: entry.earnedPeriod,
    previousAmount: currentAmount.toFixed(2),
    nextAmount: amount.toFixed(2),
    previousTitle: entry.title,
  };
}
