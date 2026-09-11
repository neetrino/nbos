import type { PrismaClient } from '@nbos/database';
import { sql } from '@nbos/database';
import type { MessengerInternalSection } from './messenger-core.constants';
import { MESSENGER_CORE_INTERNAL_ZONE } from './messenger-core.constants';
import { MESSENGER_INTERNAL_SECTION_TYPES } from './messenger-core-internal.types';
import {
  sqlAfterListCursor,
  sqlIlikeContains,
  sqlFalse,
  sqlInStrings,
  sqlListOrderLimit,
  sqlParticipantOrGrantedAccess,
  sqlReadStateJoin,
  sqlTrue,
  sqlUnreadPredicate,
  sqlVisibleLatestMessageJoin,
  type SqlFragment,
} from './messenger-core-list-sql';
import type { MessengerListCursor } from './messenger-core-list-page';
import { TASK_DISCUSSION_VISIBILITY_HIDDEN } from './messenger-task-discussion.metadata';

type PrismaLike = Pick<InstanceType<typeof PrismaClient>, '$queryRaw'>;

export type InternalFilteredListSqlInput = {
  employeeId: string;
  viewScope: string;
  grantIds: string[];
  allowedTaskIds: string[] | null;
  section?: MessengerInternalSection;
  q?: string;
  cursor?: MessengerListCursor;
  take: number;
};

export async function selectInternalUnreadConversationIds(
  prisma: PrismaLike,
  input: InternalFilteredListSqlInput,
): Promise<MessengerListCursor[]> {
  return prisma.$queryRaw<MessengerListCursor[]>(buildInternalUnreadIdSql(input));
}

export function buildInternalUnreadIdSql(input: InternalFilteredListSqlInput): SqlFragment {
  return sql`
    SELECT c.id, c.last_message_at AS "lastMessageAt", c.created_at AS "createdAt"
    FROM messenger_conversations c
    ${sqlVisibleLatestMessageJoin(true)}
    ${sqlReadStateJoin(input.employeeId)}
    WHERE c.zone = ${MESSENGER_CORE_INTERNAL_ZONE}
      AND c.status = 'ACTIVE'
      AND ${sqlInternalAccess(input.employeeId, input.viewScope, input.grantIds)}
      AND ${sqlInternalSection(input.section)}
      AND ${sqlInternalSearch(input.q)}
      AND ${sqlInternalTaskGate(input.allowedTaskIds)}
      AND ${sqlAfterListCursor(input.cursor)}
      AND ${sqlUnreadPredicate(input.employeeId)}
    ${sqlListOrderLimit(input.take)}`;
}

function sqlInternalAccess(employeeId: string, viewScope: string, grantIds: string[]): SqlFragment {
  if (viewScope === 'ALL') return sqlTrue();
  return sqlParticipantOrGrantedAccess(employeeId, grantIds);
}

function sqlInternalSection(section: MessengerInternalSection | undefined): SqlFragment {
  if (!section || section === 'all' || section === 'collections') return sqlTrue();
  if (section === 'workspaces') {
    return sql`EXISTS (
      SELECT 1 FROM messenger_conversation_links l
      WHERE l.conversation_id = c.id AND l.entity_type = 'WORKSPACE'
    )`;
  }
  const types = MESSENGER_INTERNAL_SECTION_TYPES[section];
  if (!types) return sqlTrue();
  if (types.length === 0) return sqlFalse();
  return sql`c.type IN ${sqlInStrings(types)}`;
}

function sqlInternalSearch(q: string | undefined): SqlFragment {
  const term = q?.trim();
  if (!term) return sqlTrue();
  const like = sqlIlikeContains(term);
  return sql`(
    c.title ILIKE ${like}
    OR EXISTS (
      SELECT 1 FROM messenger_messages m
      WHERE m.conversation_id = c.id
        AND m.deleted_at IS NULL
        AND m.content ILIKE ${like}
        AND m.metadata #>> '{taskDiscussion,visibility}' IS DISTINCT FROM ${TASK_DISCUSSION_VISIBILITY_HIDDEN}
    )
  )`;
}

function sqlInternalTaskGate(allowedTaskIds: string[] | null): SqlFragment {
  if (allowedTaskIds === null) return sqlTrue();
  if (allowedTaskIds.length === 0) return sql`c.type <> 'TASK'`;
  return sql`(
    c.type <> 'TASK'
    OR EXISTS (
      SELECT 1 FROM messenger_conversation_links l
      WHERE l.conversation_id = c.id
        AND l.entity_type = 'TASK'
        AND l.relation_type = 'PRIMARY'
        AND l.entity_id IN ${sqlInStrings(allowedTaskIds)}
    )
  )`;
}
