import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import type { MessengerDeltaPage } from '@/lib/api/messenger-core-delta';
import { parseMessengerHttpCheckpoint } from './messenger-checkpoint-store';
import type { MessengerZone } from './messenger-query-keys';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHECKPOINT = /^(0|[1-9]\d{0,19})$/;

export function assertMessengerDeltaPage(
  zone: MessengerZone,
  storedCheckpoint: string,
  page: MessengerDeltaPage<MessengerCoreConversationRow>,
  previous?: MessengerDeltaPage<MessengerCoreConversationRow>,
): void {
  const token = parseMessengerHttpCheckpoint(page);
  if (!token || page.resetRequired) throw new Error('Messenger delta requires bootstrap');
  if (!CHECKPOINT.test(page.checkpoint) || compareDecimal(page.checkpoint, storedCheckpoint) < 0) {
    throw new Error('Messenger delta checkpoint regressed');
  }
  if (
    previous &&
    (page.checkpoint !== previous.checkpoint ||
      page.authorizationEpoch !== previous.authorizationEpoch)
  ) {
    throw new Error('Messenger delta snapshot moved');
  }
  if (typeof page.hasMore !== 'boolean' || !Array.isArray(page.summaries)) {
    throw new Error('Messenger delta page malformed');
  }
  if (!Array.isArray(page.removedConversationIds) || !Array.isArray(page.changedConversationIds)) {
    throw new Error('Messenger delta ids malformed');
  }
  assertCursorPresence(page);
  assertPageIdentifiers(zone, page);
}

export function rememberDeltaCursor(seen: Set<string>, cursor: string | undefined): void {
  if (!cursor) return;
  if (seen.has(cursor)) throw new Error('Messenger delta cursor repeated');
  seen.add(cursor);
}

function assertCursorPresence(page: MessengerDeltaPage<MessengerCoreConversationRow>): void {
  if (page.hasMore && !page.nextCursor) throw new Error('Messenger delta truncated');
  if (!page.hasMore && page.nextCursor) throw new Error('Messenger delta cursor unexpected');
}

function assertPageIdentifiers(
  zone: MessengerZone,
  page: MessengerDeltaPage<MessengerCoreConversationRow>,
): void {
  for (const summary of page.summaries) {
    if (!UUID.test(summary.id) || summary.zone !== zone) {
      throw new Error('Messenger delta summary zone mismatch');
    }
  }
  for (const id of [...page.removedConversationIds, ...page.changedConversationIds]) {
    if (!UUID.test(id)) throw new Error('Messenger delta id malformed');
  }
}

function compareDecimal(left: string, right: string): number {
  if (left === right) return 0;
  if (left.length !== right.length) return left.length > right.length ? 1 : -1;
  return left > right ? 1 : -1;
}
