import { PrismaClient } from '@nbos/database';
import { mergeActiveParentProjectScope } from '../active-project-list-scope';

export async function getExtensionStats(
  prisma: InstanceType<typeof PrismaClient>,
  projectId?: string,
) {
  const where = mergeActiveParentProjectScope(projectId ? { projectId } : {}, { projectId });

  const [total, byStatus] = await Promise.all([
    prisma.extension.count({ where }),
    prisma.extension.groupBy({ by: ['status'], where, _count: true }),
  ]);

  return { total, byStatus };
}
