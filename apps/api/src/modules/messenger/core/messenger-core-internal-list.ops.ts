import { PrismaClient, type Prisma } from '@nbos/database';
import { RESOURCE_GRANT_RESOURCE_TYPE } from '@nbos/shared';
import { activeResourceAccessGrantWhere } from '../../credentials/credential-active-grant.where';
import { buildTasksParticipationWhere } from '../../tasks/task-involves-employee-where.op';
import {
  loadTasksScopedEmployeeIds,
  tasksViewBypassesRowFilter,
  type TasksAccessContext,
} from '../../tasks/tasks-scoped-access';
import {
  MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE,
  MESSENGER_CORE_INTERNAL_ZONE,
  type MessengerInternalSection,
} from './messenger-core.constants';
import { MESSENGER_INTERNAL_SECTION_TYPES } from './messenger-core-internal.types';
import type {
  MessengerInternalConversationListItem,
  MessengerInternalListQuery,
  MessengerInternalListResult,
} from './messenger-core-internal.types';
import { hiddenTaskDiscussionNoteWhere } from './messenger-task-discussion.metadata';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listAccessibleInternalConversations(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
  query: MessengerInternalListQuery,
  editScope = 'NONE',
  tasksAccess?: TasksAccessContext,
): Promise<MessengerInternalListResult> {
  if (query.filter === 'mentions') {
    return { items: [], mentionsAvailable: false };
  }
  const pageSize = query.pageSize ?? MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE;
  const unreadOnly = query.filter === 'unread' || query.unread === true;
  const where = await internalListWhere(prisma, employeeId, viewScope, query, tasksAccess);
  const [rows, editGrantIds] = await Promise.all([
    prisma.messengerConversation.findMany({
      where,
      orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      take: unreadOnly ? pageSize * 5 : pageSize,
      include: listInclude(employeeId),
    }),
    loadEditGrantIds(prisma, employeeId, editScope),
  ]);
  const mapped = rows.map((row) => mapListItem(row, employeeId, editScope, editGrantIds));
  const items = unreadOnly
    ? mapped.filter((row) => row.unreadCount > 0).slice(0, pageSize)
    : mapped;
  return { items, mentionsAvailable: false };
}

export async function listAccessibleInternalConversationsByIds(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
  conversationIds: string[],
  editScope = 'NONE',
  tasksAccess?: TasksAccessContext,
): Promise<MessengerInternalConversationListItem[]> {
  if (conversationIds.length === 0) return [];
  const accessWhere = await accessibleInternalWhere(prisma, employeeId, viewScope);
  const taskGate = await taskConversationListWhere(prisma, tasksAccess);
  const editGrantIds = await loadEditGrantIds(prisma, employeeId, editScope);
  const rows = await prisma.messengerConversation.findMany({
    where: { AND: [accessWhere, { id: { in: conversationIds } }, taskGate] },
    include: listInclude(employeeId),
  });
  const byId = new Map(
    rows.map((row) => [row.id, mapListItem(row, employeeId, editScope, editGrantIds)]),
  );
  return conversationIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

async function internalListWhere(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
  query: MessengerInternalListQuery,
  tasksAccess?: TasksAccessContext,
): Promise<Prisma.MessengerConversationWhereInput> {
  const access = await accessibleInternalWhere(prisma, employeeId, viewScope);
  const taskGate = await taskConversationListWhere(prisma, tasksAccess);
  return {
    AND: [access, sectionWhere(query.section), searchWhere(query.q), taskGate],
  };
}

/** MESSENGER.VIEW ALL does not list Task conversations the caller cannot open in Tasks. */
async function taskConversationListWhere(
  prisma: PrismaLike,
  tasksAccess: TasksAccessContext | undefined,
): Promise<Prisma.MessengerConversationWhereInput> {
  if (!tasksAccess) return {};
  if (tasksViewBypassesRowFilter(tasksAccess.viewScope)) return {};
  const scopedIds = await loadTasksScopedEmployeeIds(prisma, tasksAccess);
  const rows = await prisma.task.findMany({
    where: { trashedAt: null, AND: [buildTasksParticipationWhere(scopedIds)] },
    select: { id: true },
  });
  return {
    OR: [
      { type: { not: 'TASK' } },
      {
        type: 'TASK',
        links: {
          some: {
            entityType: 'TASK',
            relationType: 'PRIMARY',
            entityId: { in: rows.map((row) => row.id) },
          },
        },
      },
    ],
  };
}

async function accessibleInternalWhere(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
): Promise<Prisma.MessengerConversationWhereInput> {
  const base: Prisma.MessengerConversationWhereInput = {
    zone: MESSENGER_CORE_INTERNAL_ZONE,
    status: 'ACTIVE',
  };
  if (viewScope === 'ALL') return base;
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

async function loadEditGrantIds(
  prisma: PrismaLike,
  employeeId: string,
  editScope: string,
): Promise<Set<string>> {
  if (editScope === 'ALL' || editScope === 'NONE') return new Set();
  const grants = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
      employeeId,
      level: 'EDIT',
      ...activeResourceAccessGrantWhere(),
    },
    select: { resourceId: true },
  });
  return new Set(grants.map((grant) => grant.resourceId));
}

function sectionWhere(
  section: MessengerInternalSection | undefined,
): Prisma.MessengerConversationWhereInput {
  if (!section || section === 'all' || section === 'collections') return {};
  if (section === 'workspaces') {
    return { links: { some: { entityType: 'WORKSPACE' } } };
  }
  const types = MESSENGER_INTERNAL_SECTION_TYPES[section];
  return types ? { type: { in: [...types] } } : {};
}

function searchWhere(q: string | undefined): Prisma.MessengerConversationWhereInput {
  const term = q?.trim();
  if (!term) return {};
  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      {
        messages: {
          some: {
            deletedAt: null,
            content: { contains: term, mode: 'insensitive' },
            ...hiddenTaskDiscussionNoteWhere(),
          },
        },
      },
    ],
  };
}

function listInclude(employeeId: string) {
  return {
    messages: {
      where: { deletedAt: null, ...hiddenTaskDiscussionNoteWhere() },
      orderBy: { createdAt: 'desc' as const },
      take: 1,
      select: { content: true },
    },
    readStates: {
      where: { employeeId },
      select: { lastReadAt: true },
    },
    userSettings: {
      where: { employeeId },
      select: { favorite: true },
    },
    participants: {
      where: { leftAt: null },
      select: {
        employeeId: true,
        role: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    },
  };
}

function mapListItem(
  row: {
    id: string;
    zone: MessengerInternalConversationListItem['zone'];
    type: MessengerInternalConversationListItem['type'];
    title: string | null;
    status: string;
    canonicalKey: string | null;
    createdAt: Date;
    lastMessageAt: Date | null;
    messages: Array<{ content: string }>;
    readStates: Array<{ lastReadAt: Date }>;
    userSettings: Array<{ favorite: boolean }>;
    participants: Array<{
      employeeId: string;
      role: string;
      employee: { firstName: string; lastName: string };
    }>;
  },
  employeeId: string,
  editScope: string,
  editGrantIds: Set<string>,
): MessengerInternalConversationListItem {
  const lastReadAt = row.readStates[0]?.lastReadAt ?? null;
  const unread =
    row.lastMessageAt !== null && (lastReadAt === null || row.lastMessageAt > lastReadAt);
  const peer =
    row.type === 'DIRECT' ? row.participants.find((p) => p.employeeId !== employeeId) : undefined;
  const self = row.participants.find((participant) => participant.employeeId === employeeId);
  return {
    id: row.id,
    zone: 'INTERNAL',
    type: row.type,
    title: row.title,
    status: row.status,
    canonicalKey: row.canonicalKey,
    createdAt: row.createdAt,
    lastMessageAt: row.lastMessageAt,
    lastMessagePreview: row.messages[0]?.content ?? null,
    unreadCount: unread ? 1 : 0,
    peerEmployeeId: peer?.employeeId ?? null,
    peerName: peer ? `${peer.employee.firstName} ${peer.employee.lastName}`.trim() : null,
    isFavorite: row.userSettings[0]?.favorite === true,
    canWrite: conversationCanWrite(editScope, self?.role ?? null, editGrantIds.has(row.id)),
  };
}

function conversationCanWrite(
  editScope: string,
  participantRole: string | null,
  hasEditGrant: boolean,
): boolean {
  if (editScope === 'NONE') return false;
  if (editScope === 'ALL' || hasEditGrant) return true;
  return participantRole !== null && participantRole !== 'READ_ONLY';
}
