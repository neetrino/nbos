import type { Prisma, PrismaClient } from '@nbos/database';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';
import type { MessengerInternalAccessSnapshot } from './messenger-core-access-snapshot';
import {
  createMessengerGrantSnapshot,
  viewGrantIdsFromSnapshot,
  type MessengerGrantSnapshot,
} from './messenger-core-grant-epoch';
import { loadAllowedTaskIds } from './messenger-core-task-acl-epoch';
import {
  MESSENGER_CORE_INTERNAL_ZONE,
  type MessengerInternalSection,
} from './messenger-core.constants';
import { MESSENGER_INTERNAL_SECTION_TYPES } from './messenger-core-internal.types';
import type { MessengerInternalListQuery } from './messenger-core-internal.types';
import { hiddenTaskDiscussionNoteWhere } from './messenger-task-discussion.metadata';
import { prismaAfterListCursor, type MessengerListCursor } from './messenger-core-list-page';

export { loadAllowedTaskIds } from './messenger-core-task-acl-epoch';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function internalListWhere(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
  query: MessengerInternalListQuery,
  tasksAccess: TasksAccessContext | undefined,
  cursor: MessengerListCursor | undefined,
  access?: MessengerInternalAccessSnapshot,
): Promise<Prisma.MessengerConversationWhereInput> {
  const [acl, taskGate] = await Promise.all([
    accessibleInternalWhere(prisma, employeeId, viewScope, access?.grants),
    taskConversationListWhere(prisma, tasksAccess, access?.tasks.allowedTaskIds),
  ]);
  return {
    AND: [
      acl,
      sectionWhere(query.section),
      searchWhere(query.q),
      taskGate,
      mentionsFilterWhere(employeeId, query.filter),
      cursor ? prismaAfterListCursor(cursor) : {},
    ],
  };
}

export async function accessibleInternalWhere(
  prisma: PrismaLike,
  employeeId: string,
  viewScope: string,
  grants?: MessengerGrantSnapshot,
): Promise<Prisma.MessengerConversationWhereInput> {
  const base: Prisma.MessengerConversationWhereInput = {
    zone: MESSENGER_CORE_INTERNAL_ZONE,
    status: 'ACTIVE',
  };
  if (viewScope === 'ALL') return base;
  const grantIds = viewGrantIdsFromSnapshot(
    grants ?? (await createMessengerGrantSnapshot(prisma, employeeId, 'INTERNAL')),
    viewScope,
  );
  const participant = { participants: { some: { employeeId, leftAt: null } } };
  if (grantIds.length === 0) return { ...base, ...participant };
  return { ...base, OR: [participant, { id: { in: grantIds } }] };
}

export async function taskConversationListWhere(
  prisma: PrismaLike,
  tasksAccess: TasksAccessContext | undefined,
  allowedTaskIds?: string[] | null,
): Promise<Prisma.MessengerConversationWhereInput> {
  const allowed =
    allowedTaskIds !== undefined ? allowedTaskIds : await loadAllowedTaskIds(prisma, tasksAccess);
  if (allowed === null) return {};
  return {
    OR: [
      { type: { not: 'TASK' } },
      {
        type: 'TASK',
        links: {
          some: {
            entityType: 'TASK',
            relationType: 'PRIMARY',
            entityId: { in: allowed },
          },
        },
      },
    ],
  };
}

function mentionsFilterWhere(
  employeeId: string,
  filter: MessengerInternalListQuery['filter'],
): Prisma.MessengerConversationWhereInput {
  if (filter !== 'mentions') return {};
  return {
    messages: {
      some: {
        deletedAt: null,
        mentions: { some: { employeeId } },
        ...hiddenTaskDiscussionNoteWhere(),
      },
    },
  };
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
