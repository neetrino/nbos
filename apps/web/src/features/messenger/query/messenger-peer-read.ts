import type { MessengerWsConversationPeerReadPayload } from '@nbos/shared';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { mergeMessengerDeliveryStatus } from '../messenger-delivery-status';
import { compareIsoInstants } from './messenger-realtime-watermarks';

/** Advances covered receipts. An older cursor cannot move READ back to DELIVERED. */
export function applyPeerReadToMessages(
  items: MessengerCoreMessageRow[],
  payload: Pick<MessengerWsConversationPeerReadPayload, 'readerId' | 'lastReadAt'>,
): MessengerCoreMessageRow[] {
  let changed = false;
  const next = items.map((row) => {
    const updated = advancePeerReadRow(row, payload);
    if (updated !== row) changed = true;
    return updated;
  });
  return changed ? next : items;
}

function advancePeerReadRow(
  row: MessengerCoreMessageRow,
  payload: Pick<MessengerWsConversationPeerReadPayload, 'readerId' | 'lastReadAt'>,
): MessengerCoreMessageRow {
  if (!peerReadCovers(row, payload)) return row;
  const status = mergeMessengerDeliveryStatus(row.status, 'READ');
  if (status === row.status) return row;
  return { ...row, status };
}

function peerReadCovers(
  row: MessengerCoreMessageRow,
  payload: Pick<MessengerWsConversationPeerReadPayload, 'readerId' | 'lastReadAt'>,
): boolean {
  if (row.direction === 'INBOUND') return false;
  if (row.senderId === payload.readerId) return false;
  return compareIsoInstants(row.createdAt, payload.lastReadAt) <= 0;
}
