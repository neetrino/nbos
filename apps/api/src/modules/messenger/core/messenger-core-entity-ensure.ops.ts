import { PrismaClient, classifyDatabaseError, type InputJsonValue } from '@nbos/database';
import {
  dealCanonicalKey,
  productCanonicalKey,
  projectGeneralCanonicalKey,
  workspaceCanonicalKey,
} from './messenger-core-canonical-key';
import {
  requireDealEntityAccess,
  requireProductEntityAccess,
  requireProjectEntityAccess,
  requireWorkSpaceEntityAccess,
} from './messenger-core-entity-access.ops';
import {
  attachEntityIdentity,
  findOrCreateEntityConversation,
  mapEntityConversation,
  relinkMappedGroupToEntity,
  type EntityConversationCreateInput,
} from './messenger-core-entity-create.ops';
import {
  detectProductLegacyOverlap,
  detectWorkspaceLegacyOverlap,
} from './messenger-core-entity-legacy.ops';
import {
  participantSeedsForDeal,
  participantSeedsForProduct,
  participantSeedsForProject,
} from './messenger-core-entity-participants.ops';
import type { MessengerEntityEnsureResult } from './messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function ensureProductWorkConversation(
  prisma: PrismaLike,
  productId: string,
  employeeId: string,
): Promise<MessengerEntityEnsureResult> {
  const product = await requireProductEntityAccess(prisma, productId, employeeId);
  const workspaceId = product.workSpace?.id ?? null;
  const input = await productCreateInput(prisma, product, workspaceId, employeeId);
  return ensureEntityConversation(prisma, input, () =>
    detectProductLegacyOverlap(prisma, {
      productId: product.id,
      productName: product.name,
      projectId: product.projectId,
      workspaceId,
    }),
  );
}

export async function ensureWorkSpaceConversation(
  prisma: PrismaLike,
  workspaceId: string,
  employeeId: string,
  tasksViewScope?: string,
): Promise<MessengerEntityEnsureResult> {
  const workspace = await requireWorkSpaceEntityAccess(
    prisma,
    workspaceId,
    employeeId,
    tasksViewScope,
  );
  if (workspace.productId) {
    return ensureProductWorkConversation(prisma, workspace.productId, employeeId);
  }
  const input = await standaloneWorkspaceCreateInput(prisma, workspace, employeeId);
  return ensureEntityConversation(prisma, input, () =>
    detectWorkspaceLegacyOverlap(prisma, {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      projectId: workspace.projectId,
    }),
  );
}

export async function ensureDealConversation(
  prisma: PrismaLike,
  dealId: string,
  employeeId: string,
): Promise<MessengerEntityEnsureResult> {
  const deal = await requireDealEntityAccess(prisma, dealId, employeeId);
  const participants = await participantSeedsForDeal(prisma, deal.id, employeeId);
  const input: EntityConversationCreateInput = {
    type: 'DEAL',
    title: deal.name?.trim() || deal.code,
    createdById: employeeId,
    canonicalKey: dealCanonicalKey(deal.id),
    metadata: { dealId: deal.id },
    links: [{ entityType: 'DEAL', entityId: deal.id, relationType: 'PRIMARY' }],
    participants,
  };
  return ensureEntityConversation(prisma, input, async () => ({ action: 'none' }));
}

export async function ensureProjectGeneralConversation(
  prisma: PrismaLike,
  projectId: string,
  employeeId: string,
): Promise<MessengerEntityEnsureResult> {
  const project = await requireProjectEntityAccess(prisma, projectId, employeeId);
  const participants = await participantSeedsForProject(prisma, project.id, employeeId);
  const input: EntityConversationCreateInput = {
    type: 'PROJECT_GENERAL',
    title: `${project.name} General`,
    createdById: employeeId,
    canonicalKey: projectGeneralCanonicalKey(project.id),
    metadata: { projectId: project.id },
    links: [{ entityType: 'PROJECT', entityId: project.id, relationType: 'PRIMARY' }],
    participants,
  };
  return ensureEntityConversation(prisma, input, async () => ({ action: 'none' }));
}

async function ensureEntityConversation(
  prisma: PrismaLike,
  input: EntityConversationCreateInput,
  detectOverlap: () => ReturnType<typeof detectProductLegacyOverlap>,
): Promise<MessengerEntityEnsureResult> {
  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey: input.canonicalKey },
  });
  if (existing) {
    await attachEntityIdentity(prisma, existing.id, input.links, input.participants);
    return toEnsureResult(mapEntityConversation(existing), false, null);
  }
  const overlap = await detectOverlap();
  if (overlap.action === 'reuse') {
    const reused = await prisma.messengerConversation.findUnique({
      where: { id: overlap.conversationId },
    });
    if (reused) {
      await attachEntityIdentity(prisma, reused.id, input.links, input.participants);
      return toEnsureResult(mapEntityConversation(reused), false, null);
    }
  }
  if (overlap.action === 'relink') {
    try {
      const relinked = await relinkMappedGroupToEntity(prisma, overlap.conversationId, input);
      return toEnsureResult(relinked, false, overlap.conversationId);
    } catch (error) {
      if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    }
  }
  const preservedId = overlap.action === 'preserve_both' ? overlap.mappedConversationId : null;
  const created = await findOrCreateEntityConversation(prisma, {
    ...input,
    metadata: preservedId
      ? ({
          ...(typeof input.metadata === 'object' && input.metadata !== null ? input.metadata : {}),
          legacyOverlapPreservedIds: [preservedId],
        } as InputJsonValue)
      : input.metadata,
  });
  if (!created.created) {
    await attachEntityIdentity(prisma, created.row.id, input.links, input.participants);
  }
  return toEnsureResult(created.row, created.created, preservedId);
}

async function productCreateInput(
  prisma: PrismaLike,
  product: { id: string; name: string; projectId: string },
  workspaceId: string | null,
  employeeId: string,
): Promise<EntityConversationCreateInput> {
  const participants = await participantSeedsForProduct(prisma, product.id, employeeId);
  const links: EntityConversationCreateInput['links'] = [
    { entityType: 'PRODUCT', entityId: product.id, relationType: 'PRIMARY' },
  ];
  if (workspaceId) {
    links.push({ entityType: 'WORKSPACE', entityId: workspaceId, relationType: 'PRIMARY' });
  }
  return {
    type: 'PRODUCT',
    title: product.name,
    createdById: employeeId,
    canonicalKey: productCanonicalKey(product.id),
    metadata: { productId: product.id, workspaceId, projectId: product.projectId },
    links,
    participants,
  };
}

async function standaloneWorkspaceCreateInput(
  prisma: PrismaLike,
  workspace: { id: string; name: string; projectId: string | null },
  employeeId: string,
): Promise<EntityConversationCreateInput> {
  const participants = workspace.projectId
    ? await participantSeedsForProject(prisma, workspace.projectId, employeeId)
    : [{ employeeId, role: 'OWNER' as const }];
  return {
    type: 'WORKSPACE',
    title: workspace.name,
    createdById: employeeId,
    canonicalKey: workspaceCanonicalKey(workspace.id),
    metadata: { workspaceId: workspace.id, projectId: workspace.projectId },
    links: [{ entityType: 'WORKSPACE', entityId: workspace.id, relationType: 'PRIMARY' }],
    participants,
  };
}

function toEnsureResult(
  row: ReturnType<typeof mapEntityConversation>,
  created: boolean,
  linkedLegacyConversationId: string | null,
): MessengerEntityEnsureResult {
  return { ...row, created, linkedLegacyConversationId };
}
