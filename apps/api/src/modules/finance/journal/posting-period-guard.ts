import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { resolvePostingMonthKey } from './posting-period-utils';

/**
 * Blocks finance mutations dated in a CLOSED posting period (NBOS period close).
 */
export async function assertPostingPeriodOpenForBookedAt(
  prisma: InstanceType<typeof PrismaClient>,
  bookedAt: Date,
): Promise<void> {
  if (Number.isNaN(bookedAt.getTime())) {
    throw new BadRequestException('Invalid booked date for posting period check');
  }

  const monthKey = resolvePostingMonthKey(bookedAt);
  const period = await prisma.financePostingPeriod.findUnique({ where: { monthKey } });
  if (period?.status === 'CLOSED') {
    throw new BadRequestException(
      `Finance posting period ${monthKey} is closed. Record a manual adjustment in an open period instead.`,
    );
  }
}
