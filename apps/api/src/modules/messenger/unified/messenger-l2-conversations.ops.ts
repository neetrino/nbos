import type { PrismaClient } from '@nbos/database';
import { canViewConversation } from '../access/messenger-conversation-access.op';
import type { MessengerAccessContext } from '../access/messenger-access.types';
import { countConversationUnreadForEmployee } from './messenger-conversation-read.ops';
import type { MessengerL2ConversationDto } from './messenger-unified.types';

type ConversationListRow = {
  id: string;
  type: string;
  title: string | null;
  status: string;
  lastMessageAt: Date | null;
  directParticipantLowId: string | null;
  directParticipantHighId: string | null;
  links: Array<{ entityType: string; entityId: string; relationType: string }>;
  messages: Array<{ content: string }>;
};

function toL2Dto(
  row: ConversationListRow,
  unreadCount: number,
  viewerId: string,
): MessengerL2ConversationDto {
  const primary = row.links.find((l) => l.relationType === 'PRIMARY') ?? row.links[0] ?? null;
  let peerEmployeeId: string | null = null;
  if (row.type === 'DIRECT') {
    peerEmployeeId =
      row.directParticipantLowId === viewerId
        ? row.directParticipantHighId
        : row.directParticipantLowId;
  }
  return {
    id: row.id,
    type: row.type,
    title: row.title?.trim() || defaultTitle(row),
    status: row.status,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: row.messages[0]?.content ?? null,
    unreadCount,
    primaryEntityType: primary?.entityType ?? null,
    primaryEntityId: primary?.entityId ?? null,
    peerEmployeeId,
  };
}

function defaultTitle(row: ConversationListRow): string {
  if (row.type === 'DIRECT') return 'Direct message';
  const primary = row.links.find((l) => l.relationType === 'PRIMARY');
  if (primary) return `${primary.entityType} chat`;
  return 'Conversation';
}

const listSelect = {
  id: true,
  type: true,
  title: true,
  status: true,
  lastMessageAt: true,
  directParticipantLowId: true,
  directParticipantHighId: true,
  links: {
    select: { entityType: true, entityId: true, relationType: true },
  },
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { content: true },
  },
};

async function mapVisibleRows(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  rows: ConversationListRow[],
): Promise<MessengerL2ConversationDto[]> {
  const out: MessengerL2ConversationDto[] = [];
  for (const row of rows) {
    if (!(await canViewConversation(prisma, access, row.id))) continue;
    const unreadCount = await countConversationUnreadForEmployee(
      prisma,
      row.id,
      access.employeeId,
    );
    out.push(toL2Dto(row, unreadCount, access.employeeId));
  }
  return out;
}

/** Conversations linked to a business entity (PRIMARY or RELATED). */
export async function listConversationsForEntity(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  entityType: 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK',
  entityId: string,
): Promise<MessengerL2ConversationDto[]> {
  const rows = await prisma.messengerConversation.findMany({
    where: {
      status: { in: ['ACTIVE', 'ARCHIVED'] },
      links: { some: { entityType, entityId } },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    take: 100,
    select: listSelect,
  });
  return mapVisibleRows(prisma, access, rows);
}

/**
 * For All → Project: primary project chat + product/deal/task chats under that project tree.
 */
export async function listConversationsForProjectTree(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  projectId: string,
): Promise<MessengerL2ConversationDto[]> {
  const [products, deals, tasks] = await Promise.all([
    prisma.product.findMany({ where: { projectId }, select: { id: true } }),
    prisma.deal.findMany({ where: { projectId }, select: { id: true } }),
    prisma.task.findMany({
      where: { trashedAt: null, product: { projectId } },
      select: { id: true },
    }),
  ]);
  const productIds = products.map((p) => p.id);
  const dealIds = deals.map((d) => d.id);
  const taskIds = tasks.map((t) => t.id);

  const rows = await prisma.messengerConversation.findMany({
    where: {
      status: { in: ['ACTIVE', 'ARCHIVED'] },
      OR: [
        { links: { some: { entityType: 'PROJECT', entityId: projectId } } },
        ...(productIds.length
          ? [{ links: { some: { entityType: 'PRODUCT' as const, entityId: { in: productIds } } } }]
          : []),
        ...(dealIds.length
          ? [{ links: { some: { entityType: 'DEAL' as const, entityId: { in: dealIds } } } }]
          : []),
        ...(taskIds.length
          ? [{ links: { some: { entityType: 'TASK' as const, entityId: { in: taskIds } } } }]
          : []),
      ],
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    take: 100,
    select: listSelect,
  });
  return mapVisibleRows(prisma, access, rows);
}

/** Direct conversations for the current user. */
export async function listDirectConversationsUnified(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
): Promise<MessengerL2ConversationDto[]> {
  const rows = await prisma.messengerConversation.findMany({
    where: {
      type: 'DIRECT',
      status: { in: ['ACTIVE', 'ARCHIVED'] },
      participants: {
        some: { employeeId: access.employeeId, leftAt: null },
      },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    take: 100,
    select: listSelect,
  });
  return mapVisibleRows(prisma, access, rows);
}

/** Freeform INTERNAL_GROUP chats (org-wide / unlinked). */
export async function listInternalGroupConversations(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
): Promise<MessengerL2ConversationDto[]> {
  const rows = await prisma.messengerConversation.findMany({
    where: {
      type: 'INTERNAL_GROUP',
      status: { in: ['ACTIVE', 'ARCHIVED'] },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    take: 50,
    select: listSelect,
  });
  return mapVisibleRows(prisma, access, rows);
}
