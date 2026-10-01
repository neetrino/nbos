import type { QueryClient } from '@tanstack/react-query';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { applyMessengerSendResult, patchMessengerMessages } from './messenger-cache';
import type { MessengerMessagesPage } from './messenger-cache';
import { buildOptimisticCoreMessage } from './messenger-local-send';
import { messengerQueryKeys, type MessengerZone } from './messenger-query-keys';
import {
  claimMessengerOutboxLiveSend,
  pauseMessengerOutboxReplay,
  releaseMessengerOutboxLiveSend,
} from './messenger-outbox-replay';
import { readMessengerPersistChannelIdentity } from '../persist/messenger-persist-session';
import {
  forgetMessengerOutboxEntry,
  retargetMessengerOutboxConversation,
  upsertMessengerOutboxEntry,
} from '../persist/messenger-outbox-store';
import {
  parseMessengerPersistOutbox,
  type MessengerPersistOutboxEntry,
} from '../persist/messenger-persist-outbox';
import {
  claimComposerSend,
  markComposerSendCleared,
  resetMessengerComposerClaims,
} from './messenger-send-claim';

export type CoreSendAck = {
  message: MessengerCoreMessageRow;
  conversationId: string;
  conversation?: MessengerCoreConversationRow;
};

export type CoreSendTransport = (idempotencyKey: string) => Promise<CoreSendAck>;

type LocalPhase = NonNullable<MessengerCoreMessageRow['localSend']>['phase'];

type TrackedCoreSend = {
  idempotencyKey: string;
  conversationId: string;
  zone: MessengerZone;
  phase: LocalPhase | 'accepted';
  sessionEpoch: number;
  queryClient: QueryClient;
  transport: CoreSendTransport;
  onFailure?: (error: unknown) => void;
};

const trackedSends = new Map<string, TrackedCoreSend>();

/**
 * Bumps when the signed-in employee changes.
 * An in-flight send keeps its old epoch and must not write after that.
 */
let sendSessionEpoch = 0;

export type BeginOptimisticCoreSend = {
  queryClient: QueryClient;
  zone: MessengerZone;
  conversationId: string;
  content: string;
  senderId: string | null;
  senderName: string;
  createdAt?: string;
  replyToMessageId?: string;
  mentionedEmployeeIds?: string[];
  onComposerClear: () => void;
  onFailure?: (error: unknown) => void;
  transport: CoreSendTransport;
};

/**
 * Inserts one optimistic row, clears the composer, then posts.
 * A second call for different text starts its own request.
 * A double-click of the same text reuses the first key and does not post again.
 */
export async function beginOptimisticCoreSend(input: BeginOptimisticCoreSend): Promise<void> {
  const content = input.content.trim();
  if (!content || !input.conversationId) return;
  const claim = claimComposerSend(input.conversationId, content);
  if (!claim.accepted) return;
  const createdAt = input.createdAt ?? new Date().toISOString();
  insertOptimistic({ ...input, createdAt }, content, claim.key);
  markComposerSendCleared(input.conversationId);
  input.onComposerClear();
  const tracked = rememberSend(input, claim.key, createdAt);
  await deliverTrackedSend(tracked);
}

/** Retry of one failed logical message. The idempotency key does not change. */
export async function retryTrackedCoreSend(idempotencyKey: string): Promise<void> {
  const tracked = trackedSends.get(idempotencyKey);
  if (!tracked || tracked.phase !== 'failed') return;
  tracked.phase = 'retrying';
  patchLocalPhase(tracked, 'retrying');
  await deliverTrackedSend(tracked);
}

/**
 * Drops tracked sends and composer claims for the employee who is leaving.
 * A response that resolves later still holds its `TrackedCoreSend` and is ignored.
 */
export function resetOptimisticCoreSendState(): void {
  sendSessionEpoch += 1;
  trackedSends.clear();
  resetMessengerComposerClaims();
  pauseMessengerOutboxReplay();
}

function insertOptimistic(
  input: BeginOptimisticCoreSend,
  content: string,
  idempotencyKey: string,
): void {
  const optimistic = buildOptimisticCoreMessage({
    conversationId: input.conversationId,
    content,
    idempotencyKey,
    senderId: input.senderId,
    senderName: input.senderName,
    zone: input.zone,
    createdAt: input.createdAt ?? new Date().toISOString(),
    replyToMessageId: input.replyToMessageId,
    mentionedEmployeeIds: input.mentionedEmployeeIds,
  });
  patchMessengerMessages(input.queryClient, input.conversationId, optimistic, {
    createIfMissing: true,
  });
}

function rememberSend(
  input: BeginOptimisticCoreSend,
  idempotencyKey: string,
  createdAt: string,
): TrackedCoreSend {
  recordOutbox(input, idempotencyKey, createdAt);
  const tracked: TrackedCoreSend = {
    idempotencyKey,
    conversationId: input.conversationId,
    zone: input.zone,
    phase: 'sending',
    sessionEpoch: sendSessionEpoch,
    queryClient: input.queryClient,
    transport: input.transport,
    onFailure: input.onFailure,
  };
  trackedSends.set(idempotencyKey, tracked);
  return tracked;
}

async function deliverTrackedSend(tracked: TrackedCoreSend): Promise<void> {
  claimMessengerOutboxLiveSend(tracked.idempotencyKey);
  try {
    await deliverTrackedSendBody(tracked);
  } finally {
    releaseMessengerOutboxLiveSend(tracked.idempotencyKey);
  }
}

async function deliverTrackedSendBody(tracked: TrackedCoreSend): Promise<void> {
  try {
    const ack = await tracked.transport(tracked.idempotencyKey);
    if (!isSendSessionCurrent(tracked)) return;
    adoptConversation(tracked, ack.conversationId);
    reconcileTrackedSend(tracked, ack);
    tracked.phase = 'accepted';
    trackedSends.delete(tracked.idempotencyKey);
    forgetCurrentOutbox(tracked.idempotencyKey);
  } catch (error: unknown) {
    if (!isSendSessionCurrent(tracked)) return;
    tracked.phase = 'failed';
    patchLocalPhase(tracked, 'failed');
    tracked.onFailure?.(error);
  }
}

function isSendSessionCurrent(tracked: TrackedCoreSend): boolean {
  return tracked.sessionEpoch === sendSessionEpoch;
}

function reconcileTrackedSend(tracked: TrackedCoreSend, ack: CoreSendAck): void {
  const message: MessengerCoreMessageRow = {
    ...ack.message,
    idempotencyKey: ack.message.idempotencyKey ?? tracked.idempotencyKey,
  };
  applyMessengerSendResult(tracked.queryClient, tracked.zone, message, ack.conversation);
}

function adoptConversation(tracked: TrackedCoreSend, nextId: string): void {
  if (!nextId || tracked.conversationId === nextId) return;
  moveMessengerThread(tracked.queryClient, tracked.conversationId, nextId);
  retargetCurrentOutbox(tracked.conversationId, nextId);
  for (const send of trackedSends.values()) {
    if (send.conversationId === tracked.conversationId) send.conversationId = nextId;
  }
}

function moveMessengerThread(queryClient: QueryClient, fromId: string, toId: string): void {
  const fromKey = messengerQueryKeys.messages(fromId);
  const toKey = messengerQueryKeys.messages(toId);
  const fromPage = queryClient.getQueryData<MessengerMessagesPage>(fromKey);
  if (!fromPage) return;
  const toPage = queryClient.getQueryData<MessengerMessagesPage>(toKey);
  queryClient.setQueryData<MessengerMessagesPage>(toKey, {
    items: mergeMovedItems(toPage?.items ?? [], fromPage.items),
    meta: toPage?.meta ?? fromPage.meta,
  });
  queryClient.removeQueries({ queryKey: fromKey, exact: true });
}

function mergeMovedItems(
  current: MessengerCoreMessageRow[],
  incoming: MessengerCoreMessageRow[],
): MessengerCoreMessageRow[] {
  const ids = new Set(current.map((row) => row.id));
  return [...current, ...incoming.filter((row) => !ids.has(row.id))];
}

function patchLocalPhase(tracked: TrackedCoreSend, phase: LocalPhase): void {
  const key = messengerQueryKeys.messages(tracked.conversationId);
  tracked.queryClient.setQueryData<MessengerMessagesPage>(key, (page) => {
    if (!page) return page;
    return {
      ...page,
      items: page.items.map((row) => patchRowPhase(row, tracked.idempotencyKey, phase)),
    };
  });
}

function patchRowPhase(
  row: MessengerCoreMessageRow,
  idempotencyKey: string,
  phase: LocalPhase,
): MessengerCoreMessageRow {
  if (row.localSend?.idempotencyKey !== idempotencyKey) return row;
  return { ...row, localSend: { ...row.localSend, phase } };
}

function recordOutbox(
  input: BeginOptimisticCoreSend,
  idempotencyKey: string,
  createdAt: string,
): void {
  const identityId = readMessengerPersistChannelIdentity();
  if (!identityId) return;
  const entry = outboxEntry(input, idempotencyKey, createdAt);
  if (!entry) return;
  upsertMessengerOutboxEntry(identityId, entry);
}

function outboxEntry(
  input: BeginOptimisticCoreSend,
  idempotencyKey: string,
  createdAt: string,
): MessengerPersistOutboxEntry | null {
  const entry: MessengerPersistOutboxEntry = {
    idempotencyKey,
    conversationId: input.conversationId,
    zone: input.zone,
    content: input.content.trim(),
    senderId: input.senderId,
    senderName: input.senderName.trim() || 'You',
    createdAt,
    replay: input.zone === 'CLIENT' ? 'withhold' : 'internal',
    replyToMessageId: input.replyToMessageId,
    mentionedEmployeeIds: input.mentionedEmployeeIds,
  };
  return parseMessengerPersistOutbox([entry]) ? entry : null;
}

function forgetCurrentOutbox(idempotencyKey: string): void {
  const identityId = readMessengerPersistChannelIdentity();
  if (!identityId) return;
  forgetMessengerOutboxEntry(identityId, idempotencyKey);
}

function retargetCurrentOutbox(fromId: string, toId: string): void {
  const identityId = readMessengerPersistChannelIdentity();
  if (!identityId) return;
  retargetMessengerOutboxConversation(identityId, fromId, toId);
}
