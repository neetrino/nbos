import type { PrismaClient } from '@nbos/database';
import {
  buildDealParticipationWhere,
  buildProductParticipationWhere,
  buildProjectParticipationWhere,
} from '../../platform-access/platform-team-graph.where';
import {
  loadMessengerScopedEmployeeIds,
  type MessengerLegacyAccessContext,
} from './messenger-legacy-channel-access.op';
import type { MessengerAccessContext } from './messenger-access.types';

export type MessengerLinkEntity = 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK' | 'WORKSPACE';

function asLegacyAccess(access: MessengerAccessContext): MessengerLegacyAccessContext {
  return {
    employeeId: access.employeeId,
    departmentIds: access.departmentIds ?? [],
    viewScope: (access.viewScope ?? 'NONE') as MessengerLegacyAccessContext['viewScope'],
    editScope: (access.editScope ?? 'NONE') as MessengerLegacyAccessContext['editScope'],
    driveViewScope: access.driveViewScope,
  };
}

/**
 * Entity ACL for conversation links: ALL bypasses; OWN/DEPARTMENT uses team graph /
 * task participation; NONE denies.
 */
export async function canAccessLinkedEntity(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  entityType: MessengerLinkEntity,
  entityId: string,
): Promise<boolean> {
  if (access.viewScope === 'ALL') return true;
  if (!access.viewScope || access.viewScope === 'NONE') return false;

  const legacy = asLegacyAccess(access);
  const scopedIds = await loadMessengerScopedEmployeeIds(prisma, legacy);

  switch (entityType) {
    case 'PROJECT': {
      const row = await prisma.project.findFirst({
        where: { id: entityId, trashedAt: null, ...buildProjectParticipationWhere(scopedIds) },
        select: { id: true },
      });
      return Boolean(row);
    }
    case 'PRODUCT': {
      const row = await prisma.product.findFirst({
        where: {
          id: entityId,
          OR: [
            buildProductParticipationWhere(scopedIds),
            { project: buildProjectParticipationWhere(scopedIds) },
          ],
        },
        select: { id: true },
      });
      return Boolean(row);
    }
    case 'DEAL': {
      const row = await prisma.deal.findFirst({
        where: {
          id: entityId,
          ...buildDealParticipationWhere(scopedIds),
        },
        select: { id: true },
      });
      return Boolean(row);
    }
    case 'TASK': {
      const row = await prisma.task.findFirst({
        where: {
          id: entityId,
          trashedAt: null,
          OR: [
            { creatorId: { in: scopedIds } },
            { assigneeId: { in: scopedIds } },
            { reviewerId: { in: scopedIds } },
            { coAssignees: { hasSome: scopedIds } },
            { observers: { hasSome: scopedIds } },
            { product: buildProductParticipationWhere(scopedIds) },
            { product: { project: buildProjectParticipationWhere(scopedIds) } },
          ],
        },
        select: { id: true },
      });
      return Boolean(row);
    }
    case 'WORKSPACE': {
      const row = await prisma.workSpace.findFirst({
        where: {
          id: entityId,
          OR: [
            { product: buildProductParticipationWhere(scopedIds) },
            { project: buildProjectParticipationWhere(scopedIds) },
          ],
        },
        select: { id: true },
      });
      return Boolean(row);
    }
    default:
      return false;
  }
}

export async function assertLinkedEntityExists(
  prisma: InstanceType<typeof PrismaClient>,
  entityType: Exclude<MessengerLinkEntity, 'WORKSPACE'>,
  entityId: string,
): Promise<{ title: string; projectId: string | null }> {
  switch (entityType) {
    case 'PROJECT': {
      const row = await prisma.project.findFirst({
        where: { id: entityId, trashedAt: null },
        select: { id: true, name: true },
      });
      if (!row) throw new Error('PROJECT_NOT_FOUND');
      return { title: row.name, projectId: row.id };
    }
    case 'PRODUCT': {
      const row = await prisma.product.findUnique({
        where: { id: entityId },
        select: { id: true, name: true, projectId: true },
      });
      if (!row) throw new Error('PRODUCT_NOT_FOUND');
      return { title: row.name, projectId: row.projectId };
    }
    case 'DEAL': {
      const row = await prisma.deal.findUnique({
        where: { id: entityId },
        select: { id: true, name: true, code: true, projectId: true },
      });
      if (!row) throw new Error('DEAL_NOT_FOUND');
      return { title: row.name?.trim() || row.code, projectId: row.projectId };
    }
    case 'TASK': {
      const row = await prisma.task.findFirst({
        where: { id: entityId, trashedAt: null },
        select: {
          id: true,
          title: true,
          code: true,
          product: { select: { projectId: true } },
        },
      });
      if (!row) throw new Error('TASK_NOT_FOUND');
      return {
        title: row.title.trim() || row.code,
        projectId: row.product?.projectId ?? null,
      };
    }
    default: {
      const _exhaustive: never = entityType;
      return _exhaustive;
    }
  }
}
