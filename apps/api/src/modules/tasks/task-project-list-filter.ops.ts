import { BadRequestException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';

type PrismaClientLike = Pick<InstanceType<typeof PrismaClient>, 'order'>;

/**
 * Tasks that belong to a project: direct product/extension, PROJECT link,
 * or Work Space tied to the project / its products / extensions.
 */
export function buildProjectTaskScopeWhere(projectId: string): Prisma.TaskWhereInput {
  return {
    OR: [
      { product: { projectId } },
      { extension: { projectId } },
      { links: { some: { entityType: 'PROJECT', entityId: projectId } } },
      { workspace: { projectId } },
      { workspace: { product: { projectId } } },
      { workspace: { extension: { projectId } } },
    ],
  };
}

/** Tasks tied to a specific Order (product/extension/workspace or ORDER link). */
export function buildOrderTaskScopeWhere(orderId: string): Prisma.TaskWhereInput {
  return {
    OR: [
      { product: { order: { id: orderId } } },
      { extension: { order: { id: orderId } } },
      { links: { some: { entityType: 'ORDER', entityId: orderId } } },
      { workspace: { product: { order: { id: orderId } } } },
      { workspace: { extension: { order: { id: orderId } } } },
    ],
  };
}

export async function assertOrderBelongsToProject(
  prisma: PrismaClientLike,
  orderId: string,
  projectId: string,
): Promise<void> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    select: { projectId: true },
  });
  if (!row || row.projectId !== projectId) {
    throw new BadRequestException('orderId does not belong to the given project');
  }
}
