import type { PrismaClient, WorkSpaceTypeEnum } from '@nbos/database';

export interface CanonicalWorkSpace {
  id: string;
  name: string;
  type: WorkSpaceTypeEnum;
  projectId: string | null;
  productId: string | null;
  extensionId: string | null;
  scrumEnabled: boolean;
}

const CANONICAL_SELECT = {
  id: true,
  name: true,
  type: true,
  projectId: true,
  productId: true,
  extensionId: true,
  scrumEnabled: true,
} as const;

/**
 * Extension delivery rows are not Product Work Spaces. Agent scope and
 * discovery must use the parent Product Work Space id (conflict D2).
 */
export async function resolveCanonicalWorkSpace(
  prisma: InstanceType<typeof PrismaClient>,
  workspaceId: string,
): Promise<CanonicalWorkSpace | null> {
  const row = await prisma.workSpace.findUnique({
    where: { id: workspaceId },
    select: CANONICAL_SELECT,
  });
  if (!row) {
    return null;
  }
  if (row.type !== 'EXTENSION_DELIVERY') {
    return row;
  }
  if (!row.extensionId) {
    return null;
  }
  const extension = await prisma.extension.findUnique({
    where: { id: row.extensionId },
    select: { productId: true },
  });
  if (!extension?.productId) {
    return null;
  }
  return findProductWorkSpace(prisma, extension.productId);
}

/**
 * WORKSPACE grants may still point at an Extension delivery id. Policy matching
 * uses the Product Work Space id (conflict D2), so the stored scope is resolved
 * the same way as a client-supplied workspaceId.
 */
export async function canonicalWorkspaceScopeId(
  prisma: InstanceType<typeof PrismaClient>,
  scopeType: string,
  scopeId: string,
): Promise<string> {
  if (scopeType !== 'WORKSPACE') {
    return scopeId;
  }
  const canonical = await resolveCanonicalWorkSpace(prisma, scopeId);
  return canonical?.id ?? scopeId;
}

export async function listDiscoverableWorkSpaces(
  prisma: InstanceType<typeof PrismaClient>,
  params: { ids?: readonly string[]; projectId?: string },
): Promise<CanonicalWorkSpace[]> {
  const where = {
    ...discoverableWorkSpaceWhere(),
    ...(params.ids ? { id: { in: [...params.ids] } } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
  };
  if (params.ids && params.ids.length === 0) {
    return [];
  }
  return prisma.workSpace.findMany({
    where,
    select: CANONICAL_SELECT,
    orderBy: { name: 'asc' },
  });
}

export async function findProductWorkSpace(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
): Promise<CanonicalWorkSpace | null> {
  return prisma.workSpace.findFirst({
    where: { productId, ...discoverableWorkSpaceWhere() },
    select: CANONICAL_SELECT,
  });
}

function discoverableWorkSpaceWhere() {
  return { type: { not: 'EXTENSION_DELIVERY' as const } };
}
