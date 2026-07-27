import type { PrismaClient, TransactionClient } from '@nbos/database';

type Tx = TransactionClient | InstanceType<typeof PrismaClient>;

export type InboxStateSnapshot = {
  unreadCount: number;
  version: number;
};

/**
 * Atomic inbox counter helpers. Call inside the same transaction as notification mutations.
 */
export async function incrementInboxUnread(
  tx: Tx,
  employeeId: string,
): Promise<InboxStateSnapshot> {
  const rows = await tx.$queryRaw<Array<{ unread_count: number; version: bigint }>>`
    INSERT INTO notification_inbox_state (employee_id, unread_count, version, updated_at)
    VALUES (${employeeId}, 1, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (employee_id) DO UPDATE
    SET
      unread_count = notification_inbox_state.unread_count + 1,
      version = notification_inbox_state.version + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING unread_count, version
  `;
  return mapRow(rows[0]);
}

/**
 * Set-based inbox bump for bulk inserts. `deltas` is recipientId → inserted unread count.
 * Returns final snapshots for SSE (one per recipient).
 */
export async function incrementInboxUnreadMany(
  tx: Tx,
  deltas: ReadonlyMap<string, number>,
): Promise<Map<string, InboxStateSnapshot>> {
  const result = new Map<string, InboxStateSnapshot>();
  if (deltas.size === 0) return result;

  const employeeIds: string[] = [];
  const counts: number[] = [];
  for (const [employeeId, count] of deltas) {
    if (count <= 0) continue;
    employeeIds.push(employeeId);
    counts.push(count);
  }
  if (employeeIds.length === 0) return result;

  const rows = await tx.$queryRaw<
    Array<{ employee_id: string; unread_count: number; version: bigint }>
  >`
    WITH incoming AS (
      SELECT *
      FROM unnest(${employeeIds}::text[], ${counts}::int[]) AS t(employee_id, delta)
    )
    INSERT INTO notification_inbox_state (employee_id, unread_count, version, updated_at)
    SELECT employee_id, delta, 1, CURRENT_TIMESTAMP
    FROM incoming
    ON CONFLICT (employee_id) DO UPDATE
    SET
      unread_count = notification_inbox_state.unread_count + EXCLUDED.unread_count,
      version = notification_inbox_state.version + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING employee_id, unread_count, version
  `;

  for (const row of rows) {
    result.set(row.employee_id, mapRow(row));
  }
  return result;
}

export async function decrementInboxUnread(
  tx: Tx,
  employeeId: string,
): Promise<InboxStateSnapshot> {
  const rows = await tx.$queryRaw<Array<{ unread_count: number; version: bigint }>>`
    INSERT INTO notification_inbox_state (employee_id, unread_count, version, updated_at)
    VALUES (${employeeId}, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (employee_id) DO UPDATE
    SET
      unread_count = GREATEST(0, notification_inbox_state.unread_count - 1),
      version = notification_inbox_state.version + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING unread_count, version
  `;
  return mapRow(rows[0]);
}

/** Mark-all-read: force counter to zero and bump version once. */
export async function resetInboxUnread(tx: Tx, employeeId: string): Promise<InboxStateSnapshot> {
  const rows = await tx.$queryRaw<Array<{ unread_count: number; version: bigint }>>`
    INSERT INTO notification_inbox_state (employee_id, unread_count, version, updated_at)
    VALUES (${employeeId}, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (employee_id) DO UPDATE
    SET
      unread_count = 0,
      version = notification_inbox_state.version + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING unread_count, version
  `;
  return mapRow(rows[0]);
}

export async function readInboxState(
  tx: Tx,
  employeeId: string,
): Promise<InboxStateSnapshot | null> {
  const rows = await tx.$queryRaw<Array<{ unread_count: number; version: bigint }>>`
    SELECT unread_count, version
    FROM notification_inbox_state
    WHERE employee_id = ${employeeId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapRow(rows[0]);
}

/**
 * Atomically set unread counter to actual COUNT (missing-state / repair path).
 * Bumps version when the value changes or the row is inserted.
 */
export async function syncInboxUnreadToActual(
  tx: Tx,
  employeeId: string,
  actualUnread: number,
): Promise<InboxStateSnapshot> {
  const rows = await tx.$queryRaw<Array<{ unread_count: number; version: bigint }>>`
    INSERT INTO notification_inbox_state (employee_id, unread_count, version, updated_at)
    VALUES (${employeeId}, ${actualUnread}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (employee_id) DO UPDATE
    SET
      unread_count = EXCLUDED.unread_count,
      version = CASE
        WHEN notification_inbox_state.unread_count IS DISTINCT FROM EXCLUDED.unread_count
          THEN notification_inbox_state.version + 1
        ELSE notification_inbox_state.version
      END,
      updated_at = CURRENT_TIMESTAMP
    RETURNING unread_count, version
  `;
  return mapRow(rows[0]);
}

function mapRow(row: { unread_count: number; version: bigint } | undefined): InboxStateSnapshot {
  if (!row) {
    return { unreadCount: 0, version: 0 };
  }
  return {
    unreadCount: Number(row.unread_count),
    version: Number(row.version),
  };
}
