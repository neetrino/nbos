import { PrismaClient } from '@nbos/database';
import { mergeActiveParentProjectScope } from '../active-project-list-scope';

export async function getProductStats(
  prisma: InstanceType<typeof PrismaClient>,
  projectId?: string,
) {
  const where = mergeActiveParentProjectScope(projectId ? { projectId } : {}, { projectId });

  const [total, byStatus, byType] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ['status'], where, _count: true }),
    prisma.product.groupBy({ by: ['productType'], where, _count: true }),
  ]);

  return { total, byStatus, byType };
}
