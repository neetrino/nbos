import { PrismaClient, type Prisma } from '@nbos/database';
import { RESOURCE_GRANT_RESOURCE_TYPE } from '@nbos/shared';
import { activeResourceAccessGrantWhere } from '../../credentials/credential-active-grant.where';
import {
  MESSENGER_CORE_CLIENT_LIST_PAGE_SIZE,
  MESSENGER_CORE_CLIENT_ZONE,
  type MessengerClientSection,
} from './messenger-core.constants';
import type {
  MessengerClientConversationListItem,
  MessengerClientListQuery,
  MessengerClientListResult,
} from './messenger-core-client.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listAccessibleClientConversations(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  clientSendScope: string,
  query: MessengerClientListQuery,
): Promise<MessengerClientListResult> {
  const pageSize = query.pageSize ?? MESSENGER_CORE_CLIENT_LIST_PAGE_SIZE;
  const extra = query.filter === 'unread' || query.filter === 'needs_response';
  const where = await clientListWhere(prisma, employeeId, clientReadScope, query);
  const rows = await prisma.messengerConversation.findMany({
    where,
    orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: extra ? pageSize * 5 : pageSize,
    include: clientListInclude(employeeId),
  });
  const mapped = rows.map((row) => mapClientListItem(row, clientSendScope));
  return { items: applyClientListFilter(mapped, query.filter, pageSize) };
}

export async function listAccessibleClientConversationsByIds(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  clientSendScope: string,
  conversationIds: string[],
): Promise<MessengerClientConversationListItem[]> {
  if (conversationIds.length === 0) return [];
  const accessWhere = await accessibleClientWhere(prisma, employeeId, clientReadScope);
  const rows = await prisma.messengerConversation.findMany({
    where: { AND: [accessWhere, { id: { in: conversationIds } }] },
    include: clientListInclude(employeeId),
  });
  const byId = new Map(rows.map((row) => [row.id, mapClientListItem(row, clientSendScope)]));
  return conversationIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

async function clientListWhere(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  query: MessengerClientListQuery,
): Promise<Prisma.MessengerConversationWhereInput> {
  const access = await accessibleClientWhere(prisma, employeeId, clientReadScope);
  return {
    AND: [
      access,
      sectionWhere(query.section),
      searchWhere(query.q),
      assignedWhere(employeeId, query.filter),
      providerWhere(query.provider),
    ],
  };
}

async function accessibleClientWhere(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
): Promise<Prisma.MessengerConversationWhereInput> {
  const base: Prisma.MessengerConversationWhereInput = {
    zone: MESSENGER_CORE_CLIENT_ZONE,
    status: 'ACTIVE',
  };
  if (clientReadScope === 'ALL') return base;
  const grants = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
      employeeId,
      level: { in: ['VIEW', 'EDIT'] },
      ...activeResourceAccessGrantWhere(),
    },
    select: { resourceId: true },
  });
  return {
    ...base,
    OR: [
      { participants: { some: { employeeId, leftAt: null } } },
      { id: { in: grants.map((grant) => grant.resourceId) } },
    ],
  };
}

function sectionWhere(
  section: MessengerClientSection | undefined,
): Prisma.MessengerConversationWhereInput {
  if (!section || section === 'inbox' || section === 'collections') return {};
  if (section === 'sales') {
    return {
      OR: [
        { links: { some: { entityType: 'LEAD' } } },
        { externalMappings: { some: { provider: { in: ['INSTAGRAM', 'FACEBOOK'] } } } },
      ],
    };
  }
  return {
    links: { some: { entityType: { in: ['CLIENT', 'PRODUCT'] } } },
  };
}

function searchWhere(q: string | undefined): Prisma.MessengerConversationWhereInput {
  const term = q?.trim();
  if (!term) return {};
  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      {
        messages: {
          some: { deletedAt: null, content: { contains: term, mode: 'insensitive' } },
        },
      },
    ],
  };
}

function assignedWhere(
  employeeId: string,
  filter: MessengerClientListQuery['filter'],
): Prisma.MessengerConversationWhereInput {
  if (filter !== 'assigned') return {};
  return { participants: { some: { employeeId, leftAt: null } } };
}

function providerWhere(
  provider: MessengerClientListQuery['provider'],
): Prisma.MessengerConversationWhereInput {
  if (!provider) return {};
  return { externalMappings: { some: { provider } } };
}

function applyClientListFilter(
  items: MessengerClientConversationListItem[],
  filter: MessengerClientListQuery['filter'],
  pageSize: number,
): MessengerClientConversationListItem[] {
  if (filter === 'unread') return items.filter((row) => row.unreadCount > 0).slice(0, pageSize);
  if (filter === 'needs_response') {
    return items.filter((row) => row.lastMessageDirection === 'INBOUND').slice(0, pageSize);
  }
  return items.slice(0, pageSize);
}

function clientListInclude(employeeId: string) {
  return {
    messages: {
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' as const },
      take: 1,
      select: { content: true, direction: true },
    },
    readStates: { where: { employeeId }, select: { lastReadAt: true } },
    userSettings: { where: { employeeId }, select: { favorite: true } },
    participants: {
      where: { leftAt: null, employeeId },
      select: { role: true },
    },
    externalMappings: { select: { provider: true }, take: 1 },
    links: {
      where: { entityType: 'LEAD' as const, relationType: 'PRIMARY' as const },
      select: { entityId: true },
    },
  };
}

function mapClientListItem(
  row: {
    id: string;
    zone: MessengerClientConversationListItem['zone'];
    type: MessengerClientConversationListItem['type'];
    title: string | null;
    status: string;
    canonicalKey: string | null;
    createdAt: Date;
    lastMessageAt: Date | null;
    messages: Array<{ content: string; direction: string }>;
    readStates: Array<{ lastReadAt: Date }>;
    userSettings: Array<{ favorite: boolean }>;
    participants: Array<{ role: string }>;
    externalMappings: Array<{ provider: MessengerClientConversationListItem['provider'] }>;
    links: Array<{ entityId: string }>;
  },
  clientSendScope: string,
): MessengerClientConversationListItem {
  const lastReadAt = row.readStates[0]?.lastReadAt ?? null;
  const unread =
    row.lastMessageAt !== null && (lastReadAt === null || row.lastMessageAt > lastReadAt);
  const last = row.messages[0];
  const role = row.participants[0]?.role ?? null;
  return {
    id: row.id,
    zone: 'CLIENT',
    type: row.type,
    title: row.title,
    status: row.status,
    canonicalKey: row.canonicalKey,
    createdAt: row.createdAt,
    lastMessageAt: row.lastMessageAt,
    lastMessagePreview: last?.content ?? null,
    lastMessageDirection:
      last?.direction === 'INBOUND' || last?.direction === 'OUTBOUND' ? last.direction : null,
    unreadCount: unread ? 1 : 0,
    isFavorite: row.userSettings[0]?.favorite === true,
    canSend: clientSendScope !== 'NONE' && role !== 'READ_ONLY',
    provider: row.externalMappings[0]?.provider ?? null,
    leadId: row.links[0]?.entityId ?? null,
  };
}
