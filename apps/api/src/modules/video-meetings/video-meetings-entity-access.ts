import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaClient, VideoMeetingEntityLinkType } from '@nbos/database';
import {
  buildDealParticipationWhere,
  buildProductParticipationWhere,
  buildProjectParticipationWhere,
} from '../platform-access/platform-team-graph.where';

type EntityPermissionModule = 'CRM_DEALS' | 'PROJECTS' | 'CLIENTS';

const ENTITY_VIEW_MODULE: Record<VideoMeetingEntityLinkType, EntityPermissionModule> = {
  DEAL: 'CRM_DEALS',
  PROJECT: 'PROJECTS',
  PRODUCT: 'PROJECTS',
  CONTACT: 'CLIENTS',
};

const SCOPE_ALL = 'ALL';
const SCOPE_NONE = 'NONE';

type Prisma = InstanceType<typeof PrismaClient>;

/**
 * Re-checks that the caller may access the target business object before link attach.
 * Entity links never grant Video Meetings media ACL (ADR-VM-004 / shared helper).
 */
export async function assertVideoMeetingEntityAccessible(
  prisma: Prisma,
  permissions: Readonly<Record<string, string>>,
  employeeId: string,
  entityType: VideoMeetingEntityLinkType,
  entityId: string,
): Promise<void> {
  const module = ENTITY_VIEW_MODULE[entityType];
  const scope = permissions[`${module}_VIEW`]?.trim().toUpperCase() ?? SCOPE_NONE;
  if (!scope || scope === SCOPE_NONE) {
    throw new ForbiddenException(`No permission: ${module}.VIEW`);
  }

  const exists = await entityExists(prisma, entityType, entityId);
  if (!exists) {
    throw new NotFoundException('Entity not found');
  }

  if (scope === SCOPE_ALL) return;

  const accessible = await entityAccessibleForEmployee(prisma, entityType, entityId, employeeId);
  if (!accessible) {
    throw new NotFoundException('Entity not found');
  }
}

async function entityExists(
  prisma: Prisma,
  entityType: VideoMeetingEntityLinkType,
  entityId: string,
): Promise<boolean> {
  switch (entityType) {
    case 'DEAL':
      return Boolean(
        await prisma.deal.findUnique({ where: { id: entityId }, select: { id: true } }),
      );
    case 'PROJECT':
      return Boolean(
        await prisma.project.findUnique({ where: { id: entityId }, select: { id: true } }),
      );
    case 'PRODUCT':
      return Boolean(
        await prisma.product.findUnique({ where: { id: entityId }, select: { id: true } }),
      );
    case 'CONTACT':
      return Boolean(
        await prisma.contact.findUnique({ where: { id: entityId }, select: { id: true } }),
      );
    default: {
      const _exhaustive: never = entityType;
      void _exhaustive;
      return false;
    }
  }
}

async function entityAccessibleForEmployee(
  prisma: Prisma,
  entityType: VideoMeetingEntityLinkType,
  entityId: string,
  employeeId: string,
): Promise<boolean> {
  const scoped = [employeeId];
  switch (entityType) {
    case 'DEAL': {
      const row = await prisma.deal.findFirst({
        where: { id: entityId, ...buildDealParticipationWhere(scoped) },
        select: { id: true },
      });
      return Boolean(row);
    }
    case 'PROJECT': {
      const row = await prisma.project.findFirst({
        where: { id: entityId, ...buildProjectParticipationWhere(scoped) },
        select: { id: true },
      });
      return Boolean(row);
    }
    case 'PRODUCT': {
      const row = await prisma.product.findFirst({
        where: { id: entityId, ...buildProductParticipationWhere(scoped) },
        select: { id: true },
      });
      return Boolean(row);
    }
    case 'CONTACT': {
      const row = await prisma.contact.findFirst({
        where: {
          id: entityId,
          OR: [
            { projects: { some: buildProjectParticipationWhere(scoped) } },
            { deals: { some: buildDealParticipationWhere(scoped) } },
            { leads: { some: { assignedTo: { in: scoped } } } },
            { tickets: { some: { assignedTo: { in: scoped } } } },
          ],
        },
        select: { id: true },
      });
      return Boolean(row);
    }
    default: {
      const _exhaustive: never = entityType;
      void _exhaustive;
      return false;
    }
  }
}
