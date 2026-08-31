import { PrismaClient } from '@nbos/database';
import { MESSENGER_CORE_LEGACY_CHANNEL_KEY_PREFIX } from './messenger-core.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type LegacyOverlapDecision =
  | { action: 'reuse'; conversationId: string }
  | { action: 'relink'; conversationId: string }
  | { action: 'preserve_both'; mappedConversationId: string }
  | { action: 'none' };

type MappedGroupHit = { id: string; messageCount: number };

export async function detectProductLegacyOverlap(
  prisma: PrismaLike,
  input: {
    productId: string;
    productName: string;
    projectId: string;
    workspaceId: string | null;
  },
): Promise<LegacyOverlapDecision> {
  const linked = await findPrimaryLinkedConversation(prisma, 'PRODUCT', input.productId, 'PRODUCT');
  if (linked) return { action: 'reuse', conversationId: linked };
  if (input.workspaceId) {
    const workspaceLinked = await findPrimaryLinkedConversation(
      prisma,
      'WORKSPACE',
      input.workspaceId,
      'PRODUCT',
    );
    if (workspaceLinked) return { action: 'reuse', conversationId: workspaceLinked };
  }
  return decideMappedGroup(prisma, {
    title: input.productName,
    projectId: input.projectId,
    productId: input.productId,
    workspaceId: input.workspaceId,
  });
}

export async function detectWorkspaceLegacyOverlap(
  prisma: PrismaLike,
  input: { workspaceId: string; workspaceName: string; projectId: string | null },
): Promise<LegacyOverlapDecision> {
  const linked = await findPrimaryLinkedConversation(
    prisma,
    'WORKSPACE',
    input.workspaceId,
    'WORKSPACE',
  );
  if (linked) return { action: 'reuse', conversationId: linked };
  return decideMappedGroup(prisma, {
    title: input.workspaceName,
    projectId: input.projectId,
    productId: null,
    workspaceId: input.workspaceId,
  });
}

async function findPrimaryLinkedConversation(
  prisma: PrismaLike,
  entityType: 'PRODUCT' | 'WORKSPACE',
  entityId: string,
  expectedType: 'PRODUCT' | 'WORKSPACE',
): Promise<string | null> {
  const row = await prisma.messengerConversationLink.findFirst({
    where: {
      entityType,
      entityId,
      relationType: 'PRIMARY',
      conversation: { zone: 'INTERNAL', type: expectedType },
    },
    select: { conversationId: true },
  });
  return row?.conversationId ?? null;
}

async function decideMappedGroup(
  prisma: PrismaLike,
  input: {
    title: string;
    projectId: string | null;
    productId: string | null;
    workspaceId: string | null;
  },
): Promise<LegacyOverlapDecision> {
  const proven = await findProvenMappedGroup(prisma, {
    productId: input.productId,
    workspaceId: input.workspaceId,
  });
  if (proven) return decideByMessageCount(proven);
  if (!input.projectId) return { action: 'none' };
  const nameOnly = await findNameOnlyMappedGroup(prisma, input.title, input.projectId);
  if (!nameOnly || nameOnly.messageCount === 0) return { action: 'none' };
  return { action: 'preserve_both', mappedConversationId: nameOnly.id };
}

function decideByMessageCount(mapped: MappedGroupHit): LegacyOverlapDecision {
  if (mapped.messageCount === 0) return { action: 'relink', conversationId: mapped.id };
  return { action: 'preserve_both', mappedConversationId: mapped.id };
}

async function findProvenMappedGroup(
  prisma: PrismaLike,
  input: { productId: string | null; workspaceId: string | null },
): Promise<MappedGroupHit | null> {
  const identity = provenIdentityFilters(input);
  if (identity.length === 0) return null;
  return findUniqueMappedGroup(prisma, { OR: identity });
}

function provenIdentityFilters(input: {
  productId: string | null;
  workspaceId: string | null;
}): Array<Record<string, unknown>> {
  const filters: Array<Record<string, unknown>> = [];
  if (input.productId) {
    filters.push({ metadata: { path: ['productId'], equals: input.productId } });
    filters.push(primaryLinkFilter('PRODUCT', input.productId));
  }
  if (input.workspaceId) {
    filters.push({ metadata: { path: ['workspaceId'], equals: input.workspaceId } });
    filters.push(primaryLinkFilter('WORKSPACE', input.workspaceId));
  }
  return filters;
}

function primaryLinkFilter(entityType: 'PRODUCT' | 'WORKSPACE', entityId: string) {
  return {
    links: {
      some: { entityType, entityId, relationType: 'PRIMARY' as const },
    },
  };
}

async function findNameOnlyMappedGroup(
  prisma: PrismaLike,
  title: string,
  projectId: string,
): Promise<MappedGroupHit | null> {
  return findUniqueMappedGroup(prisma, {
    title,
    metadata: { path: ['projectId'], equals: projectId },
  });
}

async function findUniqueMappedGroup(
  prisma: PrismaLike,
  extraWhere: Record<string, unknown>,
): Promise<MappedGroupHit | null> {
  const rows = await prisma.messengerConversation.findMany({
    where: {
      zone: 'INTERNAL',
      type: 'INTERNAL_GROUP',
      canonicalKey: { startsWith: MESSENGER_CORE_LEGACY_CHANNEL_KEY_PREFIX },
      ...extraWhere,
    },
    select: {
      id: true,
      _count: { select: { messages: { where: { deletedAt: null } } } },
    },
    take: 2,
  });
  const match = rows[0];
  if (!match || rows.length > 1) return null;
  return { id: match.id, messageCount: match._count.messages };
}
