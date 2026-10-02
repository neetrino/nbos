import type { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { applyMessengerSendResult } from './messenger-cache';
import { TASK_PENDING_CONVERSATION_PREFIX } from './messenger-local-send';
import { showMessengerOutboxEntry } from '../persist/messenger-outbox-restore';
import type { MessengerPersistOutboxEntry } from '../persist/messenger-persist-outbox';
import {
  forgetMessengerOutboxEntry,
  markMessengerOutboxHydrated,
  markMessengerOutboxSocketReady,
  readMessengerOutbox,
  readMessengerOutboxGeneration,
  isMessengerOutboxReplayReady,
  withholdMessengerOutboxEntry,
} from '../persist/messenger-outbox-store';
import { readMessengerPersistChannelIdentity } from '../persist/messenger-persist-session';

export type MessengerOutboxAuth = 'allow' | 'deny' | 'unknown';

export type MessengerOutboxReplayPorts = {
  authorizeInternal: (conversationId: string) => Promise<MessengerOutboxAuth>;
  transmitInternal: (
    entry: MessengerPersistOutboxEntry,
  ) => Promise<{ message: MessengerCoreMessageRow; conversationId: string }>;
};

const liveSends = new Set<string>();
const inFlight = new Set<string>();

let portsOverride: MessengerOutboxReplayPorts | null = null;
let replayClient: QueryClient | null = null;
let replayRunning = false;
let replayAgain = false;

export function claimMessengerOutboxLiveSend(idempotencyKey: string): void {
  liveSends.add(idempotencyKey);
}

export function releaseMessengerOutboxLiveSend(idempotencyKey: string): void {
  liveSends.delete(idempotencyKey);
}

export function setMessengerOutboxReplayPortsForTests(
  ports: MessengerOutboxReplayPorts | null,
): void {
  portsOverride = ports;
}

export function noteMessengerSocketReady(queryClient: QueryClient): void {
  replayClient = queryClient;
  if (markMessengerOutboxSocketReady()) requestMessengerOutboxReplay(queryClient);
}

export function noteMessengerOutboxHydrated(queryClient: QueryClient): void {
  replayClient = queryClient;
  if (markMessengerOutboxHydrated()) requestMessengerOutboxReplay(queryClient);
}

/** Drops in-flight send claims. Store flags reset with `clearMessengerOutboxMemory`. */
export function pauseMessengerOutboxReplay(): void {
  replayAgain = false;
  liveSends.clear();
}

export function resetMessengerOutboxReplayForTests(): void {
  pauseMessengerOutboxReplay();
  inFlight.clear();
  portsOverride = null;
  replayClient = null;
  replayRunning = false;
}

export function requestMessengerOutboxReplay(queryClient: QueryClient): void {
  replayClient = queryClient;
  if (!isMessengerOutboxReplayReady()) return;
  if (replayRunning) {
    replayAgain = true;
    return;
  }
  replayRunning = true;
  void drainMessengerOutbox().finally(finishMessengerOutboxDrain);
}

async function drainMessengerOutbox(): Promise<void> {
  const identityId = readMessengerPersistChannelIdentity();
  const queryClient = replayClient;
  if (!identityId || !queryClient) return;
  const generation = readMessengerOutboxGeneration();
  for (const entry of readMessengerOutbox(identityId)) {
    if (generation !== readMessengerOutboxGeneration()) return;
    if (!canReplayInternal(entry)) continue;
    await replayInternalEntry(queryClient, identityId, generation, entry);
  }
}

function finishMessengerOutboxDrain(): void {
  replayRunning = false;
  const queryClient = replayClient;
  if (!replayAgain || !queryClient) return;
  replayAgain = false;
  requestMessengerOutboxReplay(queryClient);
}

function canReplayInternal(entry: MessengerPersistOutboxEntry): boolean {
  if (entry.zone !== 'INTERNAL' || entry.replay !== 'internal') return false;
  if (entry.conversationId.startsWith(TASK_PENDING_CONVERSATION_PREFIX)) return false;
  if (liveSends.has(entry.idempotencyKey) || inFlight.has(entry.idempotencyKey)) return false;
  return true;
}

async function replayInternalEntry(
  queryClient: QueryClient,
  identityId: string,
  generation: number,
  entry: MessengerPersistOutboxEntry,
): Promise<void> {
  inFlight.add(entry.idempotencyKey);
  try {
    await transmitAuthorized(queryClient, identityId, generation, entry);
  } finally {
    inFlight.delete(entry.idempotencyKey);
  }
}

async function transmitAuthorized(
  queryClient: QueryClient,
  identityId: string,
  generation: number,
  entry: MessengerPersistOutboxEntry,
): Promise<void> {
  showMessengerOutboxEntry(queryClient, entry);
  const auth = await replayPorts().authorizeInternal(entry.conversationId);
  if (!isReplayCurrent(identityId, generation)) return;
  if (auth === 'deny') {
    withholdMessengerOutboxEntry(identityId, entry.idempotencyKey);
    showMessengerOutboxEntry(queryClient, { ...entry, replay: 'withhold' });
    return;
  }
  if (auth !== 'allow') return;
  await sendInternalOutboxEntry(queryClient, identityId, generation, entry);
}

async function sendInternalOutboxEntry(
  queryClient: QueryClient,
  identityId: string,
  generation: number,
  entry: MessengerPersistOutboxEntry,
): Promise<void> {
  try {
    const ack = await replayPorts().transmitInternal(entry);
    if (!isReplayCurrent(identityId, generation)) return;
    forgetMessengerOutboxEntry(identityId, entry.idempotencyKey);
    applyMessengerSendResult(queryClient, 'INTERNAL', confirmedOutboxMessage(ack.message, entry));
  } catch {
    if (!isReplayCurrent(identityId, generation)) return;
    showMessengerOutboxEntry(queryClient, entry, 'failed');
  }
}

function confirmedOutboxMessage(
  message: MessengerCoreMessageRow,
  entry: MessengerPersistOutboxEntry,
): MessengerCoreMessageRow {
  return {
    ...message,
    idempotencyKey: message.idempotencyKey ?? entry.idempotencyKey,
  };
}

function isReplayCurrent(identityId: string, generation: number): boolean {
  return (
    readMessengerPersistChannelIdentity() === identityId &&
    generation === readMessengerOutboxGeneration()
  );
}

function replayPorts(): MessengerOutboxReplayPorts {
  return portsOverride ?? defaultReplayPorts;
}

const defaultReplayPorts: MessengerOutboxReplayPorts = {
  authorizeInternal: authorizeInternalConversation,
  transmitInternal: transmitInternalOutbox,
};

async function authorizeInternalConversation(conversationId: string): Promise<MessengerOutboxAuth> {
  try {
    const row = await messengerCoreApi.getConversation(conversationId);
    if (row.zone !== 'INTERNAL') return 'deny';
    return row.canWrite === true ? 'allow' : 'deny';
  } catch (error: unknown) {
    return classifyAuthFailure(error);
  }
}

function classifyAuthFailure(error: unknown): MessengerOutboxAuth {
  if (!axios.isAxiosError(error)) return 'unknown';
  const status = error.response?.status;
  if (status === 403 || status === 404) return 'deny';
  return 'unknown';
}

async function transmitInternalOutbox(entry: MessengerPersistOutboxEntry) {
  const message = await messengerCoreApi.sendMessage(entry.conversationId, {
    content: entry.content,
    idempotencyKey: entry.idempotencyKey,
    replyToMessageId: entry.replyToMessageId,
    mentionedEmployeeIds: entry.mentionedEmployeeIds,
  });
  return { message, conversationId: entry.conversationId };
}
