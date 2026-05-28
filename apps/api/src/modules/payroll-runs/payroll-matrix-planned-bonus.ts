import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { patchBonusEntryPlannedAmount } from '../bonus/patch-bonus-entry-planned-amount';

export type PatchMatrixPlannedBonusParams = {
  employeeId: string;
  orderId: string;
  amount: string;
  title?: string;
  reason: string;
};

export type PatchMatrixPlannedBonusResult = {
  bonusEntryId: string;
  projectId: string;
  previousAmount: string;
  nextAmount: string;
  previousTitle: string | null;
};

export { resolvePlannedAmountFields } from '../bonus/patch-bonus-entry-planned-amount';

export async function patchMatrixPlannedBonus(
  prisma: InstanceType<typeof PrismaClient>,
  params: PatchMatrixPlannedBonusParams,
): Promise<PatchMatrixPlannedBonusResult> {
  const entry = await prisma.bonusEntry.findFirst({
    where: { employeeId: params.employeeId, orderId: params.orderId },
    select: { id: true },
  });
  if (!entry) {
    throw new BadRequestException(
      'No bonus entry for this employee and delivery unit. Create a manual bonus first.',
    );
  }

  const result = await patchBonusEntryPlannedAmount(prisma, {
    bonusEntryId: entry.id,
    amount: params.amount,
    title: params.title,
    reason: params.reason,
  });

  return {
    bonusEntryId: result.bonusEntryId,
    projectId: result.projectId,
    previousAmount: result.previousAmount,
    nextAmount: result.nextAmount,
    previousTitle: result.previousTitle,
  };
}
