import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  buildDealParticipationWhere,
  buildProjectParticipationWhere,
} from '../../platform-access/platform-team-graph.where';
import { buildWorkSpaceParticipationWhere } from '../../tasks/task-workspace-access.op';

type PrismaLike = InstanceType<typeof PrismaClient>;

const PRODUCT_NOT_FOUND = 'Product not found';
const WORKSPACE_NOT_FOUND = 'Work Space not found';
const DEAL_NOT_FOUND = 'Deal not found';
const PROJECT_NOT_FOUND = 'Project not found';

const DEAL_SELECT = {
  id: true,
  name: true,
  code: true,
  sellerId: true,
  sellerAssistantId: true,
  pmId: true,
  projectId: true,
} as const;

export type ProductEntityAccessRow = {
  id: string;
  name: string;
  projectId: string;
  workSpace: { id: string } | null;
};

export type WorkSpaceEntityAccessRow = {
  id: string;
  name: string;
  productId: string | null;
  projectId: string | null;
  extensionId: string | null;
  type: string;
};

export type DealEntityAccessRow = {
  id: string;
  name: string | null;
  code: string;
  sellerId: string;
  sellerAssistantId: string | null;
  pmId: string | null;
  projectId: string | null;
};

export type ProjectEntityAccessRow = {
  id: string;
  name: string;
};

/**
 * MESSENGER.VIEW ALL does not skip this check. OWN users need the project team graph.
 */
export async function requireProductEntityAccess(
  prisma: PrismaLike,
  productId: string,
  employeeId: string,
): Promise<ProductEntityAccessRow> {
  const row = await prisma.product.findFirst({
    where: {
      id: productId,
      project: buildProjectParticipationWhere([employeeId]),
    },
    select: { id: true, name: true, projectId: true, workSpace: { select: { id: true } } },
  });
  if (!row) throw new NotFoundException(PRODUCT_NOT_FOUND);
  return row;
}

export async function requireProjectEntityAccess(
  prisma: PrismaLike,
  projectId: string,
  employeeId: string,
): Promise<ProjectEntityAccessRow> {
  const row = await prisma.project.findFirst({
    where: { id: projectId, ...buildProjectParticipationWhere([employeeId]) },
    select: { id: true, name: true },
  });
  if (!row) throw new NotFoundException(PROJECT_NOT_FOUND);
  return row;
}

export async function requireDealEntityAccess(
  prisma: PrismaLike,
  dealId: string,
  employeeId: string,
): Promise<DealEntityAccessRow> {
  const commercial = await prisma.deal.findFirst({
    where: { id: dealId, ...buildDealParticipationWhere([employeeId]) },
    select: DEAL_SELECT,
  });
  if (commercial) return commercial;
  return requireDealViaProjectGraph(prisma, dealId, employeeId);
}

const WORKSPACE_ACCESS_SELECT = {
  id: true,
  name: true,
  productId: true,
  projectId: true,
  extensionId: true,
  type: true,
} as const;

/**
 * Connected spaces (`productId` set) are returned here; Product team-graph is enforced
 * by {@link requireProductEntityAccess}. TASKS.VIEW / MESSENGER.VIEW ALL do not skip that.
 * Org-level STANDALONE_OPERATIONAL may use TASKS.VIEW (not NONE) after the row exists.
 */
export async function requireWorkSpaceEntityAccess(
  prisma: PrismaLike,
  workspaceId: string,
  employeeId: string,
  tasksViewScope?: string,
): Promise<WorkSpaceEntityAccessRow> {
  const workspace = await prisma.workSpace.findUnique({
    where: { id: workspaceId },
    select: WORKSPACE_ACCESS_SELECT,
  });
  if (!workspace) throw new NotFoundException(WORKSPACE_NOT_FOUND);
  if (workspace.productId) return workspace;
  const participated = await prisma.workSpace.findFirst({
    where: { id: workspaceId, ...buildWorkSpaceParticipationWhere([employeeId]) },
    select: { id: true },
  });
  if (participated) return workspace;
  if (isOrgLevelStandalone(workspace) && hasTasksView(tasksViewScope)) return workspace;
  throw new NotFoundException(WORKSPACE_NOT_FOUND);
}

function isOrgLevelStandalone(workspace: {
  type: string;
  productId: string | null;
  extensionId: string | null;
}): boolean {
  return (
    workspace.type === 'STANDALONE_OPERATIONAL' &&
    workspace.productId === null &&
    workspace.extensionId === null
  );
}

function hasTasksView(scope: string | undefined): boolean {
  const normalized = scope?.trim().toUpperCase();
  return Boolean(normalized && normalized !== 'NONE');
}

async function requireDealViaProjectGraph(
  prisma: PrismaLike,
  dealId: string,
  employeeId: string,
): Promise<DealEntityAccessRow> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: DEAL_SELECT,
  });
  if (!deal?.projectId) throw new NotFoundException(DEAL_NOT_FOUND);
  const project = await prisma.project.findFirst({
    where: { id: deal.projectId, ...buildProjectParticipationWhere([employeeId]) },
    select: { id: true },
  });
  if (!project) throw new NotFoundException(DEAL_NOT_FOUND);
  return deal;
}
