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

function mapRow(row: { unread_count: number; version: bigint } | undefined): InboxStateSnapshot {
  if (!row) {
    return { unreadCount: 0, version: 0 };
  }
  return {
    unreadCount: Number(row.unread_count),
    version: Number(row.version),
  };
}
