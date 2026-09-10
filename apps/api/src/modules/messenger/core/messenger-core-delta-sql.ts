import type { MessengerConversationZone } from '@nbos/database';
import { sql } from '@nbos/database';
import { takeListPagePlusOne } from './messenger-core-list-page';
import type { MessengerDeltaChangeRow, MessengerDeltaCursor } from './messenger-core-revision.types';

export function buildMessengerDeltaChangeSql(input: {
  zone: MessengerConversationZone;
  employeeId: string;
  after: string;
  highWater: string;
  cursor?: MessengerDeltaCursor;
  pageSize: number;
}) {
  const take = takeListPagePlusOne(input.pageSize);
  return sql`
    WITH global_rows AS (
      SELECT conversation_id, revision, change_kind
      FROM messenger_conversation_revisions
      WHERE zone = CAST(${input.zone} AS "MessengerConversationZone")
        AND revision > ${input.after}::bigint
        AND revision <= ${input.highWater}::bigint
    ),
    targeted_rows AS (
      SELECT conversation_id, revision, change_kind
      FROM messenger_employee_conversation_revisions
      WHERE employee_id = ${input.employeeId}
        AND zone = CAST(${input.zone} AS "MessengerConversationZone")
        AND revision > ${input.after}::bigint
        AND revision <= ${input.highWater}::bigint
    ),
    merged AS (
      SELECT
        COALESCE(g.conversation_id, t.conversation_id) AS conversation_id,
        GREATEST(g.revision, t.revision) AS revision,
        CASE
          WHEN t.change_kind = 'ACCESS_REMOVED' THEN t.change_kind
          WHEN t.change_kind IS NOT NULL THEN t.change_kind
          ELSE g.change_kind
        END AS change_kind,
        CASE WHEN t.conversation_id IS NOT NULL THEN 'T'::text ELSE 'G'::text END AS lane,
        (g.change_kind = 'CONVERSATION') AS has_conversation,
        (t.change_kind = 'ACCESS_REMOVED') AS has_access_removed
      FROM global_rows g
      FULL OUTER JOIN targeted_rows t ON g.conversation_id = t.conversation_id
    )
    SELECT
      conversation_id AS "conversationId",
      revision::text AS revision,
      change_kind AS "changeKind",
      lane,
      has_conversation AS "hasConversation",
      has_access_removed AS "hasAccessRemoved"
    FROM merged
    WHERE ${deltaAfterCursor(input.cursor)}
    ORDER BY revision ASC, conversation_id ASC
    LIMIT ${take}`;
}

export function mapDeltaChangeRows(rows: Array<{
  conversationId: string;
  revision: string | bigint;
  changeKind: MessengerDeltaChangeRow['changeKind'];
  lane: MessengerDeltaChangeRow['lane'];
  hasConversation: boolean | null;
  hasAccessRemoved: boolean | null;
}>): MessengerDeltaChangeRow[] {
  return rows.map((row) => ({
    conversationId: row.conversationId,
    revision: typeof row.revision === 'bigint' ? row.revision.toString(10) : row.revision,
    changeKind: row.changeKind,
    lane: row.lane,
    hasConversation: row.hasConversation === true,
    hasAccessRemoved: row.hasAccessRemoved === true,
  }));
}

function deltaAfterCursor(cursor: MessengerDeltaCursor | undefined) {
  if (!cursor) return sql`TRUE`;
  return sql`(
    revision > ${cursor.revision}::bigint
    OR (revision = ${cursor.revision}::bigint AND conversation_id > ${cursor.conversationId})
  )`;
}
