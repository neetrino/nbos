import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { buildProjectParticipationWhere } from '../platform-access/platform-team-graph.where';

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

/**
 * Tasks reachable when the viewer participates in an anchored project
 * (product / extension / workspace graph). PROJECT task links require
 * {@link assertTaskProjectParticipationAccessible}.
 */
export function buildTaskProjectParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.TaskWhereInput {
  const projectFilter = buildProjectParticipationWhere(scopedEmployeeIds);
  return {
    OR: [
      { product: { project: projectFilter } },
      { extension: { project: projectFilter } },
      { workspace: { project: projectFilter } },
      { workspace: { product: { project: projectFilter } } },
      { workspace: { extension: { project: projectFilter } } },
    ],
  };
}

/** Drive / entity context: participant fields or project participation (incl. PROJECT links). */
export async function assertTaskProjectParticipationAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  taskId: string,
  scopedEmployeeIds: ReadonlyArray<string>,
): Promise<void> {
  const projectRows = await prisma.project.findMany({
    where: buildProjectParticipationWhere([...scopedEmployeeIds]),
    select: { id: true },
  });
  const projectIds = projectRows.map((row) => row.id);
  const orParts: Prisma.TaskWhereInput[] = [
    ...((buildTaskProjectParticipationWhere([...scopedEmployeeIds]).OR ??
      []) as Prisma.TaskWhereInput[]),
  ];
  if (projectIds.length > 0) {
    orParts.push({
      links: { some: { entityType: 'PROJECT', entityId: { in: projectIds } } },
    });
  }
  const row = await prisma.task.findFirst({
    where: { id: taskId, OR: orParts },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Drive context not found.');
  }
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
