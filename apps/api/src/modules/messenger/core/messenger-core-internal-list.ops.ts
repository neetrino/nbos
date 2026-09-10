import { PrismaClient } from '@nbos/database';
import { MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE } from './messenger-core.constants';
import type {
  MessengerInternalConversationListItem,
  MessengerInternalListQuery,
  MessengerInternalListResult,
} from './messenger-core-internal.types';
import {
  MESSENGER_LIST_ORDER_BY,
  messengerListContinuation,
  parseMessengerListCursor,
  sliceMessengerListPage,
  takeListPagePlusOne,
} from './messenger-core-list-page';
import { internalListInclude, mapInternalListItem } from './messenger-core-internal-list-map';
import { selectInternalUnreadConversationIds } from './messenger-core-internal-list-filtered.ops';
import {
  createMessengerInternalAccessSnapshot,
  type MessengerInternalAccessSnapshot,
} from './messenger-core-access-snapshot';
import {
  accessibleInternalWhere,
  internalListWhere,
  taskConversationListWhere,
} from './messenger-core-internal-list-where';
import { editGrantIdsFromSnapshot, viewGrantIdsFromSnapshot } from './messenger-core-grant-epoch';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listAccessibleInternalConversations(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
  query: MessengerInternalListQuery,
  editScope = 'NONE',
  tasksAccess?: TasksAccessContext,
  access?: MessengerInternalAccessSnapshot,
): Promise<MessengerInternalListResult> {
  const snap = access ?? (await createMessengerInternalAccessSnapshot(prisma, employeeId, tasksAccess));
  const pageSize = query.pageSize ?? MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE;
  const unreadOnly = query.filter === 'unread' || query.unread === true;
  const cursor = parseMessengerListCursor(query.cursor);
  if (unreadOnly) {
    return listInternalUnreadPage(prisma, employeeId, viewScope, query, pageSize, cursor, editScope, snap);
  }
  const where = await internalListWhere(prisma, employeeId, viewScope, query, tasksAccess, cursor, snap);
  const rows = await prisma.messengerConversation.findMany({
    where,
    orderBy: MESSENGER_LIST_ORDER_BY,
    take: takeListPagePlusOne(pageSize),
    include: internalListInclude(employeeId),
  });
  const page = sliceMessengerListPage(rows, pageSize);
  const editGrantIds = editGrantIdsFromSnapshot(snap.grants, editScope);
  const items = page.items.map((row) => mapInternalListItem(row, employeeId, editScope, editGrantIds));
  return toInternalListResult(items, page);
}

export async function listAccessibleInternalConversationsByIds(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
  conversationIds: string[],
  editScope = 'NONE',
  tasksAccess?: TasksAccessContext,
  access?: MessengerInternalAccessSnapshot,
): Promise<MessengerInternalConversationListItem[]> {
  if (conversationIds.length === 0) return [];
  const snap = access ?? (await createMessengerInternalAccessSnapshot(prisma, employeeId, tasksAccess));
  const [accessWhere, taskGate] = await Promise.all([
    accessibleInternalWhere(prisma, employeeId, viewScope, snap.grants),
    taskConversationListWhere(prisma, tasksAccess, snap.tasks.allowedTaskIds),
  ]);
  const rows = await prisma.messengerConversation.findMany({
    where: { AND: [accessWhere, { id: { in: conversationIds } }, taskGate] },
    include: internalListInclude(employeeId),
  });
  const editGrantIds = editGrantIdsFromSnapshot(snap.grants, editScope);
  const byId = new Map(
    rows.map((row) => [row.id, mapInternalListItem(row, employeeId, editScope, editGrantIds)]),
  );
  return conversationIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

async function listInternalUnreadPage(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
  query: MessengerInternalListQuery,
  pageSize: number,
  cursor: ReturnType<typeof parseMessengerListCursor>,
  editScope: string,
  snap: MessengerInternalAccessSnapshot,
): Promise<MessengerInternalListResult> {
  const idRows = await selectInternalUnreadConversationIds(prisma, {
    employeeId,
    viewScope,
    grantIds: viewGrantIdsFromSnapshot(snap.grants, viewScope),
    allowedTaskIds: snap.tasks.allowedTaskIds,
    section: query.section,
    q: query.q,
    cursor,
    take: takeListPagePlusOne(pageSize),
  });
  const page = sliceMessengerListPage(idRows, pageSize);
  const items = await listAccessibleInternalConversationsByIds(
    prisma,
    employeeId,
    viewScope,
    page.items.map((row) => row.id),
    editScope,
    undefined,
    snap,
  );
  return toInternalListResult(items, page);
}

function toInternalListResult(
  items: MessengerInternalConversationListItem[],
  page: { items: Array<{ id: string; lastMessageAt: Date | null; createdAt: Date }>; hasMore: boolean },
): MessengerInternalListResult {
  return {
    items,
    mentionsAvailable: true,
    ...messengerListContinuation(page),
  };
}
