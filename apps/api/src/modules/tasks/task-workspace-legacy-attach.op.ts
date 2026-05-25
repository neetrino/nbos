import type { PrismaClient } from '@nbos/database';

/**
 * Assigns product-linked tasks without workspace to the connected Product Work Space.
 */
export async function attachLegacyProductTasksToWorkSpace(
  prisma: InstanceType<typeof PrismaClient>,
  workspaceId: string,
  productId: string,
): Promise<number> {
  const result = await prisma.task.updateMany({
    where: {
      workspaceId: null,
      OR: [{ productId }, { links: { some: { entityType: 'PRODUCT', entityId: productId } } }],
    },
    data: { workspaceId },
  });
  return result.count;
}
