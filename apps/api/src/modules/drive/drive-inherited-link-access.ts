import type { Prisma, PrismaClient } from '@nbos/database';
import type { DriveEntityAccess } from './drive-access.types';

const DRIVE_WIDE_SCOPES = new Set<string>(['ALL']);
const INHERITED_LINK_ENTITY_CAP = 150;
const SENSITIVE_CONFIDENTIALITIES = [
  'FINANCE_SENSITIVE',
  'LEGAL_SENSITIVE',
  'SECRET_ADJACENT',
] as const;

type InheritedLinkTarget = { entityType: string; entityId: string };

function projectDeliveryGraphWhere(scopedEmployeeIds: string[]): Prisma.ProjectWhereInput {
  return {
    OR: [
      {
        products: {
          some: {
            OR: [
              { pmId: { in: scopedEmployeeIds } },
              { developerId: { in: scopedEmployeeIds } },
              { designerId: { in: scopedEmployeeIds } },
              { technicalSpecialistId: { in: scopedEmployeeIds } },
              { qaLeadId: { in: scopedEmployeeIds } },
            ],
          },
        },
      },
      { extensions: { some: { assignedTo: { in: scopedEmployeeIds } } } },
      {
        orders: {
          some: {
            deal: {
              OR: [
                { sellerId: { in: scopedEmployeeIds } },
                { sellerAssistantId: { in: scopedEmployeeIds } },
                { pmId: { in: scopedEmployeeIds } },
              ],
            },
          },
        },
      },
    ],
  };
}

function productDeliveryGraphWhere(scopedEmployeeIds: string[]): Prisma.ProductWhereInput {
  return {
    OR: [
      { pmId: { in: scopedEmployeeIds } },
      { developerId: { in: scopedEmployeeIds } },
      { designerId: { in: scopedEmployeeIds } },
      { technicalSpecialistId: { in: scopedEmployeeIds } },
      { qaLeadId: { in: scopedEmployeeIds } },
    ],
  };
}

function dealDeliveryGraphWhere(scopedEmployeeIds: string[]): Prisma.DealWhereInput {
  return {
    OR: [
      { sellerId: { in: scopedEmployeeIds } },
      { sellerAssistantId: { in: scopedEmployeeIds } },
      { pmId: { in: scopedEmployeeIds } },
    ],
  };
}

function taskParticipationWhere(scopedEmployeeIds: string[]): Prisma.TaskWhereInput {
  return {
    OR: [
      { creatorId: { in: scopedEmployeeIds } },
      { assigneeId: { in: scopedEmployeeIds } },
      { coAssignees: { hasSome: scopedEmployeeIds } },
      { observers: { hasSome: scopedEmployeeIds } },
    ],
  };
}

function workspaceParticipationWhere(scopedEmployeeIds: string[]): Prisma.WorkSpaceWhereInput {
  return {
    OR: [
      { product: productDeliveryGraphWhere(scopedEmployeeIds) },
      {
        extension: {
          OR: [
            { assignedTo: { in: scopedEmployeeIds } },
            { closedById: { in: scopedEmployeeIds } },
          ],
        },
      },
      { project: projectDeliveryGraphWhere(scopedEmployeeIds) },
    ],
  };
}

async function loadScopedEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: DriveEntityAccess,
): Promise<string[]> {
  const ids = new Set<string>([access.employeeId]);
  const scope = access.driveScope?.trim().toUpperCase() ?? 'NONE';
  if (scope !== 'DEPARTMENT' || access.departmentIds.length === 0) {
    return [...ids];
  }
  const rows = await prisma.employeeDepartment.findMany({
    where: { departmentId: { in: access.departmentIds } },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });
  for (const row of rows) ids.add(row.employeeId);
  return [...ids];
}

async function collectInheritedLinkTargets(
  prisma: InstanceType<typeof PrismaClient>,
  scopedEmployeeIds: string[],
): Promise<InheritedLinkTarget[]> {
  const [projects, deals, products, tasks, workspaces] = await Promise.all([
    prisma.project.findMany({
      where: projectDeliveryGraphWhere(scopedEmployeeIds),
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.deal.findMany({
      where: dealDeliveryGraphWhere(scopedEmployeeIds),
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.product.findMany({
      where: productDeliveryGraphWhere(scopedEmployeeIds),
      select: { id: true, extensions: { select: { id: true }, take: 30 } },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.task.findMany({
      where: taskParticipationWhere(scopedEmployeeIds),
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.workSpace.findMany({
      where: workspaceParticipationWhere(scopedEmployeeIds),
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
  ]);

  const targets: InheritedLinkTarget[] = [];
  for (const row of projects) targets.push({ entityType: 'PROJECT', entityId: row.id });
  for (const row of deals) targets.push({ entityType: 'DEAL', entityId: row.id });
  for (const row of products) {
    targets.push({ entityType: 'PRODUCT', entityId: row.id });
    for (const extension of row.extensions) {
      targets.push({ entityType: 'EXTENSION', entityId: extension.id });
    }
  }
  for (const row of tasks) targets.push({ entityType: 'TASK', entityId: row.id });
  for (const row of workspaces) {
    targets.push({ entityType: 'WORK_SPACE', entityId: row.id });
  }
  return targets;
}

/**
 * Files visible via active `FileLink` to entities in the user's delivery/participation graphs.
 * Merged into `buildDriveAssetAccessWhere` for non-ALL scopes; confidentiality still applies.
 */
export async function buildDriveInheritedLinkFileAccessWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access?: DriveEntityAccess,
): Promise<Prisma.FileAssetWhereInput> {
  if (!access?.employeeId) {
    return { id: { in: [] } };
  }
  const scope = access.driveScope?.trim().toUpperCase() ?? 'NONE';
  if (DRIVE_WIDE_SCOPES.has(scope)) {
    return { id: { in: [] } };
  }

  const scopedEmployeeIds = await loadScopedEmployeeIds(prisma, access);
  const targets = await collectInheritedLinkTargets(prisma, scopedEmployeeIds);
  if (targets.length === 0) {
    return { id: { in: [] } };
  }

  const employeeId = access.employeeId;
  const grantAccess: Prisma.FileAssetWhereInput = {
    assetGrants: {
      some: {
        granteeEmployeeId: employeeId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    },
  };

  return {
    AND: [
      { deletedAt: null },
      {
        links: {
          some: {
            unlinkedAt: null,
            OR: targets.map((target) => ({
              entityType: target.entityType,
              entityId: target.entityId,
            })),
          },
        },
      },
      {
        OR: [
          { visibility: { in: ['INTERNAL', 'PROJECT_TEAM', 'CLIENT_VISIBLE', 'PARTNER_VISIBLE'] } },
          { ownerId: employeeId },
          { createdById: employeeId },
          grantAccess,
        ],
      },
      {
        OR: [
          { confidentiality: { notIn: [...SENSITIVE_CONFIDENTIALITIES] } },
          { ownerId: employeeId },
          { createdById: employeeId },
          grantAccess,
        ],
      },
    ],
  };
}
