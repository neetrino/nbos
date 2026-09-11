import { PrismaClient, type Prisma } from '@nbos/database';
import {
  createMessengerGrantSnapshot,
  viewGrantIdsFromSnapshot,
  type MessengerGrantSnapshot,
} from './messenger-core-grant-epoch';
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
import { listAssignedConversationIds } from './messenger-core-client-list-assigned.ops';
import { clientListInclude, mapClientListItem } from './messenger-core-client-list-map';
import { selectClientFilteredConversationIds } from './messenger-core-client-list-filtered.ops';
import {
  MESSENGER_LIST_ORDER_BY,
  messengerListContinuation,
  parseMessengerListCursor,
  prismaAfterListCursor,
  sliceMessengerListPage,
  takeListPagePlusOne,
  type MessengerListCursor,
} from './messenger-core-list-page';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listAccessibleClientConversations(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  clientSendScope: string,
  query: MessengerClientListQuery,
  grants?: MessengerGrantSnapshot,
): Promise<MessengerClientListResult> {
  const snap = grants ?? (await createMessengerGrantSnapshot(prisma, employeeId, 'CLIENT'));
  const pageSize = query.pageSize ?? MESSENGER_CORE_CLIENT_LIST_PAGE_SIZE;
  const cursor = parseMessengerListCursor(query.cursor);
  if (query.filter === 'assigned') {
    return listAssignedClientConversations(
      prisma,
      employeeId,
      clientReadScope,
      clientSendScope,
      query,
      pageSize,
      cursor,
      snap,
    );
  }
  if (query.filter === 'unread' || query.filter === 'needs_response') {
    return listClientFilteredPage(
      prisma,
      employeeId,
      clientReadScope,
      clientSendScope,
      query,
      pageSize,
      cursor,
      query.filter,
      snap,
    );
  }
  return listClientPlainPage(
    prisma,
    employeeId,
    clientReadScope,
    clientSendScope,
    query,
    pageSize,
    cursor,
    snap,
  );
}

export async function listAccessibleClientConversationsByIds(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  clientSendScope: string,
  conversationIds: string[],
  grants?: MessengerGrantSnapshot,
): Promise<MessengerClientConversationListItem[]> {
  if (conversationIds.length === 0) return [];
  const snap = grants ?? (await createMessengerGrantSnapshot(prisma, employeeId, 'CLIENT'));
  const accessWhere = accessibleClientWhere(employeeId, clientReadScope, snap);
  const rows = await prisma.messengerConversation.findMany({
    where: { AND: [accessWhere, { id: { in: conversationIds } }] },
    include: clientListInclude(employeeId),
  });
  const byId = new Map(
    rows.map((row) => [row.id, mapClientListItem(row, employeeId, clientSendScope)]),
  );
  return conversationIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

async function listClientPlainPage(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  clientSendScope: string,
  query: MessengerClientListQuery,
  pageSize: number,
  cursor: MessengerListCursor | undefined,
  grants: MessengerGrantSnapshot,
): Promise<MessengerClientListResult> {
  const where = clientListWhere(employeeId, clientReadScope, query, cursor, grants);
  const rows = await prisma.messengerConversation.findMany({
    where,
    orderBy: MESSENGER_LIST_ORDER_BY,
    take: takeListPagePlusOne(pageSize),
    include: clientListInclude(employeeId),
  });
  const page = sliceMessengerListPage(rows, pageSize);
  const items = page.items.map((row) => mapClientListItem(row, employeeId, clientSendScope));
  return toClientListResult(items, page);
}

async function listClientFilteredPage(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  clientSendScope: string,
  query: MessengerClientListQuery,
  pageSize: number,
  cursor: MessengerListCursor | undefined,
  kind: 'unread' | 'needs_response',
  grants: MessengerGrantSnapshot,
): Promise<MessengerClientListResult> {
  const grantIds = viewGrantIdsFromSnapshot(grants, clientReadScope === 'ALL' ? 'ALL' : 'OWN');
  const idRows = await selectClientFilteredConversationIds(prisma, {
    employeeId,
    clientReadScope,
    grantIds,
    section: query.section,
    q: query.q,
    provider: query.provider,
    cursor,
    take: takeListPagePlusOne(pageSize),
    kind,
  });
  const page = sliceMessengerListPage(idRows, pageSize);
  const items = await listAccessibleClientConversationsByIds(
    prisma,
    employeeId,
    clientReadScope,
    clientSendScope,
    page.items.map((row) => row.id),
    grants,
  );
  return toClientListResult(items, page);
}

async function listAssignedClientConversations(
  prisma: PrismaLike,
  employeeId: string,
  clientReadScope: string,
  clientSendScope: string,
  query: MessengerClientListQuery,
  pageSize: number,
  cursor: MessengerListCursor | undefined,
  grants: MessengerGrantSnapshot,
): Promise<MessengerClientListResult> {
  const access = accessibleClientWhere(employeeId, clientReadScope, grants);
  const ids = await listAssignedConversationIds(prisma, employeeId, access);
  if (ids.length === 0) return { items: [], hasMore: false };
  const rows = await prisma.messengerConversation.findMany({
    where: {
      AND: [
        access,
        { id: { in: ids } },
        sectionWhere(query.section),
        searchWhere(query.q),
        providerWhere(query.provider),
        cursor ? prismaAfterListCursor(cursor) : {},
      ],
    },
    orderBy: MESSENGER_LIST_ORDER_BY,
    take: takeListPagePlusOne(pageSize),
    include: clientListInclude(employeeId),
  });
  const page = sliceMessengerListPage(rows, pageSize);
  const items = page.items.map((row) => mapClientListItem(row, employeeId, clientSendScope));
  return toClientListResult(items, page);
}

function toClientListResult(
  items: MessengerClientConversationListItem[],
  page: { items: MessengerListCursor[]; hasMore: boolean },
): MessengerClientListResult {
  return { items, ...messengerListContinuation(page) };
}

function clientListWhere(
  employeeId: string,
  clientReadScope: string,
  query: MessengerClientListQuery,
  cursor: MessengerListCursor | undefined,
  grants: MessengerGrantSnapshot,
): Prisma.MessengerConversationWhereInput {
  const access = accessibleClientWhere(employeeId, clientReadScope, grants);
  return {
    AND: [
      access,
      sectionWhere(query.section),
      searchWhere(query.q),
      providerWhere(query.provider),
      cursor ? prismaAfterListCursor(cursor) : {},
    ],
  };
}

function accessibleClientWhere(
  employeeId: string,
  clientReadScope: string,
  grants: MessengerGrantSnapshot,
): Prisma.MessengerConversationWhereInput {
  const base: Prisma.MessengerConversationWhereInput = {
    zone: MESSENGER_CORE_CLIENT_ZONE,
    status: 'ACTIVE',
  };
  if (clientReadScope === 'ALL') return base;
  const grantIds = viewGrantIdsFromSnapshot(grants, clientReadScope);
  const participant = { participants: { some: { employeeId, leftAt: null } } };
  if (grantIds.length === 0) return { ...base, ...participant };
  return { ...base, OR: [participant, { id: { in: grantIds } }] };
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
  return { links: { some: { entityType: { in: ['CLIENT', 'PRODUCT'] } } } };
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

function providerWhere(
  provider: MessengerClientListQuery['provider'],
): Prisma.MessengerConversationWhereInput {
  if (!provider) return {};
  return { externalMappings: { some: { provider } } };
}
