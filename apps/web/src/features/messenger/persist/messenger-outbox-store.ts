import { MESSENGER_PERSIST_OUTBOX_MAX } from './messenger-persist.constants';
import type { MessengerPersistOutboxEntry } from './messenger-persist-outbox';

const ACCEPTED_KEY_MAX = 100;

let boundIdentity: string | null = null;
let entries: MessengerPersistOutboxEntry[] = [];
let generation = 0;
let adoptedCapturedAt = 0;
const acceptedKeys = new Set<string>();
let persistScheduler: (() => void) | null = null;
let socketReady = false;
let outboxHydrated = false;

export function readMessengerOutboxGeneration(): number {
  return generation;
}

export function registerMessengerOutboxPersistScheduler(schedule: (() => void) | null): void {
  persistScheduler = schedule;
}

export function readMessengerOutbox(identityId: string): MessengerPersistOutboxEntry[] {
  if (boundIdentity !== identityId) return [];
  return entries.map(copyOutboxEntry);
}

export function upsertMessengerOutboxEntry(
  identityId: string,
  entry: MessengerPersistOutboxEntry,
): void {
  if (boundIdentity && boundIdentity !== identityId) return;
  boundIdentity = identityId;
  const index = entries.findIndex((row) => row.idempotencyKey === entry.idempotencyKey);
  if (index < 0 && entries.length >= MESSENGER_PERSIST_OUTBOX_MAX) return;
  if (index >= 0) entries[index] = copyOutboxEntry(entry);
  else entries.push(copyOutboxEntry(entry));
  acceptedKeys.delete(entry.idempotencyKey);
  notifyMessengerOutboxChanged();
}

export function forgetMessengerOutboxEntry(identityId: string, idempotencyKey: string): void {
  if (boundIdentity !== identityId) return;
  const next = entries.filter((row) => row.idempotencyKey !== idempotencyKey);
  if (next.length === entries.length) return;
  entries = next;
  rememberAcceptedKey(idempotencyKey);
  notifyMessengerOutboxChanged();
}

export function retargetMessengerOutboxConversation(
  identityId: string,
  fromId: string,
  toId: string,
): void {
  if (!fromId || !toId || fromId === toId || boundIdentity !== identityId) return;
  let changed = false;
  entries = entries.map((row) => {
    if (row.conversationId !== fromId) return row;
    changed = true;
    return { ...row, conversationId: toId };
  });
  if (changed) notifyMessengerOutboxChanged();
}

/** Adds keys this tab has not already accepted. Does not drop local rows. */
export function mergeRemoteMessengerOutbox(
  identityId: string,
  incoming: readonly MessengerPersistOutboxEntry[],
): MessengerPersistOutboxEntry[] {
  if (boundIdentity && boundIdentity !== identityId) return [];
  boundIdentity = identityId;
  const seen = new Set(entries.map((row) => row.idempotencyKey));
  const added: MessengerPersistOutboxEntry[] = [];
  for (const entry of incoming) {
    if (seen.has(entry.idempotencyKey) || acceptedKeys.has(entry.idempotencyKey)) continue;
    if (entries.length >= MESSENGER_PERSIST_OUTBOX_MAX) break;
    const copy = copyOutboxEntry(entry);
    entries.push(copy);
    seen.add(copy.idempotencyKey);
    added.push(copy);
  }
  if (added.length > 0) notifyMessengerOutboxChanged();
  return added;
}

export function withholdMessengerOutboxEntry(identityId: string, idempotencyKey: string): void {
  if (boundIdentity !== identityId) return;
  entries = entries.map((row) =>
    row.idempotencyKey === idempotencyKey ? { ...row, replay: 'withhold' } : row,
  );
  notifyMessengerOutboxChanged();
}

export function shouldAdoptRemoteMessengerOutbox(capturedAt: number): boolean {
  if (capturedAt <= adoptedCapturedAt) return false;
  adoptedCapturedAt = capturedAt;
  return true;
}

export function noteMessengerOutboxCapturedAt(capturedAt: number): void {
  if (capturedAt > adoptedCapturedAt) adoptedCapturedAt = capturedAt;
}

export function markMessengerOutboxSocketReady(): boolean {
  socketReady = true;
  return outboxHydrated;
}

export function markMessengerOutboxHydrated(): boolean {
  outboxHydrated = true;
  return socketReady;
}

export function isMessengerOutboxReplayReady(): boolean {
  return socketReady && outboxHydrated;
}

/**
 * Drops a different employee's pending rows and bumps the outbox generation.
 * The same employee keeps the current outbox so an unchanged identity can still record.
 */
export function releaseMessengerOutboxForIdentity(nextIdentityId: string): void {
  if (boundIdentity === null || boundIdentity === nextIdentityId) return;
  clearMessengerOutboxMemory();
}

export function clearMessengerOutboxMemory(): void {
  boundIdentity = null;
  entries = [];
  adoptedCapturedAt = 0;
  acceptedKeys.clear();
  socketReady = false;
  outboxHydrated = false;
  generation += 1;
}

function notifyMessengerOutboxChanged(): void {
  persistScheduler?.();
}

function rememberAcceptedKey(idempotencyKey: string): void {
  if (acceptedKeys.has(idempotencyKey)) return;
  if (acceptedKeys.size >= ACCEPTED_KEY_MAX) {
    const oldest = acceptedKeys.values().next().value;
    if (oldest) acceptedKeys.delete(oldest);
  }
  acceptedKeys.add(idempotencyKey);
}

function copyOutboxEntry(entry: MessengerPersistOutboxEntry): MessengerPersistOutboxEntry {
  return {
    ...entry,
    mentionedEmployeeIds: entry.mentionedEmployeeIds?.slice(),
  };
}
