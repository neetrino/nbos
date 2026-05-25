import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

export interface CompanyBonusAnchor {
  projectId: string;
  orderId: string;
  projectCode: string;
  orderCode: string;
}

/**
 * Company-scoped bonuses (marketing/support planned) need an order + project FK.
 * Uses the oldest order in the DB until a dedicated company anchor exists (NBOS backlog).
 */
export async function resolveCompanyBonusAnchor(prisma: PrismaClient): Promise<CompanyBonusAnchor> {
  const order = await prisma.order.findFirst({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      code: true,
      projectId: true,
      project: { select: { code: true } },
    },
  });
  if (order == null) {
    throw new BadRequestException(
      'No order exists to anchor company bonuses. Create at least one order/project first.',
    );
  }
  return {
    orderId: order.id,
    projectId: order.projectId,
    orderCode: order.code,
    projectCode: order.project.code,
  };
}
