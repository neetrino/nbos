import { join, sql } from '@nbos/database';
import { TASK_DISCUSSION_VISIBILITY_HIDDEN } from './messenger-task-discussion.metadata';
import type { MessengerListCursor } from './messenger-core-list-page';

export type SqlFragment = ReturnType<typeof sql>;

export function sqlInStrings(ids: readonly string[]): SqlFragment {
  if (ids.length === 0) {
    throw new Error('sqlInStrings requires at least one value');
  }
  return sql`(${join(ids.map((id) => sql`${id}`))})`;
}

export function sqlTrue(): SqlFragment {
  return sql`TRUE`;
}

export function sqlFalse(): SqlFragment {
  return sql`FALSE`;
}

export function sqlParticipantOrGrantedAccess(
  employeeId: string,
  grantIds: readonly string[],
): SqlFragment {
  const participant = sql`
    EXISTS (
      SELECT 1
      FROM messenger_conversation_participants p
      WHERE p.conversation_id = c.id
        AND p.employee_id = ${employeeId}
        AND p.left_at IS NULL
    )`;
  if (grantIds.length === 0) return sql`(${participant})`;
  return sql`(${participant} OR c.id IN ${sqlInStrings(grantIds)})`;
}

export function sqlVisibleLatestMessageJoin(excludeHiddenTaskNotes: boolean): SqlFragment {
  if (!excludeHiddenTaskNotes) {
    return sql`
      LEFT JOIN LATERAL (
        SELECT m.sender_id, m.direction, m.created_at
        FROM messenger_messages m
        WHERE m.conversation_id = c.id AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1
      ) latest ON TRUE`;
  }
  return sql`
    LEFT JOIN LATERAL (
      SELECT m.sender_id, m.direction, m.created_at
      FROM messenger_messages m
      WHERE m.conversation_id = c.id
        AND m.deleted_at IS NULL
        AND m.metadata #>> '{taskDiscussion,visibility}' IS DISTINCT FROM ${TASK_DISCUSSION_VISIBILITY_HIDDEN}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT 1
    ) latest ON TRUE`;
}

export function sqlReadStateJoin(employeeId: string): SqlFragment {
  return sql`
    LEFT JOIN messenger_conversation_read_states rs
      ON rs.conversation_id = c.id AND rs.employee_id = ${employeeId}`;
}

export function sqlOwnSendNotUnread(employeeId: string): SqlFragment {
  return sql`latest.sender_id IS DISTINCT FROM ${employeeId}`;
}

export function sqlUnreadPredicate(employeeId: string): SqlFragment {
  return sql`
    latest.created_at IS NOT NULL
    AND ${sqlOwnSendNotUnread(employeeId)}
    AND (rs.last_read_at IS NULL OR latest.created_at > rs.last_read_at)`;
}

export function sqlNeedsResponsePredicate(): SqlFragment {
  return sql`latest.direction = 'INBOUND'`;
}

export function sqlAfterListCursor(cursor: MessengerListCursor | undefined): SqlFragment {
  if (!cursor) return sqlTrue();
  if (cursor.lastMessageAt) {
    return sql`(
      c.last_message_at < ${cursor.lastMessageAt}
      OR c.last_message_at IS NULL
      OR (
        c.last_message_at = ${cursor.lastMessageAt}
        AND c.created_at < ${cursor.createdAt}
      )
      OR (
        c.last_message_at = ${cursor.lastMessageAt}
        AND c.created_at = ${cursor.createdAt}
        AND c.id < ${cursor.id}
      )
    )`;
  }
  return sql`(
    c.last_message_at IS NULL
    AND (
      c.created_at < ${cursor.createdAt}
      OR (c.created_at = ${cursor.createdAt} AND c.id < ${cursor.id})
    )
  )`;
}

export function sqlListOrderLimit(take: number): SqlFragment {
  return sql`
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC, c.id DESC
    LIMIT ${take}`;
}

export function sqlIlikeContains(term: string): string {
  return `%${term}%`;
}
