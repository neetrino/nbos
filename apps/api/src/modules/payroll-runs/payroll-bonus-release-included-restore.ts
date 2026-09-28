import { PrismaClient } from '@nbos/database';

/**
 * Restores `PAID` bonus releases to `INCLUDED_IN_PAYROLL` after cash attribution is reversed.
 * Does not notify Wallet or resync ProductBonusPool.
 */
export async function restorePayrollBonusReleasesIncludedForSalaryLine(
  prisma: InstanceType<typeof PrismaClient>,
  releaseIds: string[],
): Promise<void> {
  if (releaseIds.length === 0) {
    return;
  }
  await prisma.bonusRelease.updateMany({
    where: { id: { in: releaseIds }, status: 'PAID' },
    data: { status: 'INCLUDED_IN_PAYROLL' },
  });
}
