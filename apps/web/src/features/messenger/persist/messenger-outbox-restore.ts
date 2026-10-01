import type { QueryClient } from '@tanstack/react-query';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { patchMessengerMessages } from '../query/messenger-cache';
import { buildOptimisticCoreMessage } from '../query/messenger-local-send';
import type { MessengerPersistOutboxEntry } from './messenger-persist-outbox';

export function showMessengerOutboxEntries(
  queryClient: QueryClient,
  entries: readonly MessengerPersistOutboxEntry[],
): void {
  for (const entry of entries) showMessengerOutboxEntry(queryClient, entry);
}

export function showMessengerOutboxEntry(
  queryClient: QueryClient,
  entry: MessengerPersistOutboxEntry,
  phase?: NonNullable<MessengerCoreMessageRow['localSend']>['phase'],
): void {
  const row = buildOptimisticCoreMessage({
    conversationId: entry.conversationId,
    content: entry.content,
    idempotencyKey: entry.idempotencyKey,
    senderId: entry.senderId,
    senderName: entry.senderName,
    zone: entry.zone,
    createdAt: entry.createdAt,
    replyToMessageId: entry.replyToMessageId,
    mentionedEmployeeIds: entry.mentionedEmployeeIds,
    phase: phase ?? visiblePhase(entry),
  });
  patchMessengerMessages(queryClient, entry.conversationId, withClientHold(entry, row), {
    createIfMissing: true,
  });
}

function visiblePhase(
  entry: MessengerPersistOutboxEntry,
): NonNullable<MessengerCoreMessageRow['localSend']>['phase'] {
  if (entry.zone === 'CLIENT' || entry.replay === 'withhold') return 'failed';
  return 'sending';
}

function withClientHold(
  entry: MessengerPersistOutboxEntry,
  row: MessengerCoreMessageRow,
): MessengerCoreMessageRow {
  if (entry.zone !== 'CLIENT') return row;
  return { ...row, status: 'OUTCOME_UNKNOWN' };
}
