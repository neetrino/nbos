import type { QueryClient } from '@tanstack/react-query';
import { applyMessengerPersistEnvelope } from './messenger-persist-hydrate';
import {
  createIndexedDbMessengerPersistBackend,
  createMemoryMessengerPersistBackend,
  type MessengerPersistBackend,
} from './messenger-persist-idb';
import { parseMessengerPersistEnvelope } from './messenger-persist-envelope';
import { isMessengerPersistenceEnabled } from './messenger-persist.constants';
import {
  beginMessengerPersistHydration,
  isMessengerPersistGenerationCurrent,
  isMessengerPersistIdentity,
  readMessengerPersistGeneration,
  settleMessengerPersistHydration,
} from './messenger-persist-session';
import { markMessengerPersistReadySettled, readMessengerPersistReadyState } from './messenger-persist-ready';
import { writeMessengerPersistCapture } from './messenger-persist-write';
import type { MessengerPersistEnvelope } from './messenger-persist-envelope';

let backendOverride: MessengerPersistBackend | null = null;
let defaultBackend: MessengerPersistBackend | null = null;

export function getMessengerPersistBackend(): MessengerPersistBackend {
  if (backendOverride) return backendOverride;
  if (!defaultBackend) {
    defaultBackend =
      typeof indexedDB === 'undefined'
        ? createMemoryMessengerPersistBackend()
        : createIndexedDbMessengerPersistBackend();
  }
  return defaultBackend;
}

export function setMessengerPersistBackendForTests(backend: MessengerPersistBackend | null): void {
  backendOverride = backend;
  if (backend === null) defaultBackend = null;
}

export async function hydrateMessengerPersistCache(
  queryClient: QueryClient,
  identityId: string,
): Promise<void> {
  const ready = readMessengerPersistReadyState();
  if (ready.sessionIdentityId !== null && ready.sessionIdentityId !== identityId) return;
  if (ready.preparedIdentityId !== null && ready.preparedIdentityId !== identityId) return;
  if (!isMessengerPersistenceEnabled() || !isMessengerPersistIdentity(identityId)) {
    markMessengerPersistReadySettled();
    return;
  }
  if (ready.preparedIdentityId === identityId && ready.settled) return;
  const hydrationStartedAt = Date.now();
  const generation = ensureHydrationGeneration(queryClient, identityId);
  try {
    const raw = await getMessengerPersistBackend().read(identityId);
    if (!isMessengerPersistGenerationCurrent(generation)) return;
    await restoreSerializedEnvelope(queryClient, identityId, raw, hydrationStartedAt, generation);
  } catch {
    return;
  } finally {
    settleMessengerPersistHydration(queryClient, generation);
  }
}

export async function restoreSerializedEnvelope(
  queryClient: QueryClient,
  identityId: string,
  raw: string | null,
  hydrationStartedAt: number,
  generation: number,
): Promise<boolean> {
  if (raw == null) return false;
  const envelope = parseSerializedEnvelope(raw, identityId);
  if (!envelope) {
    await deleteMessengerPersistRecord(identityId);
    return false;
  }
  return applyMessengerPersistEnvelope(queryClient, envelope, hydrationStartedAt, generation);
}

export async function persistMessengerCacheNow(
  queryClient: QueryClient,
  identityId: string,
  generation: number,
  announce: ((envelope: MessengerPersistEnvelope) => void) | null,
): Promise<boolean> {
  if (!isMessengerPersistenceEnabled() || !isMessengerPersistIdentity(identityId)) return false;
  try {
    return await writeMessengerPersistCapture(
      getMessengerPersistBackend(),
      queryClient,
      identityId,
      generation,
      announce,
    );
  } catch {
    return false;
  }
}

export async function deleteMessengerPersistRecord(identityId: string): Promise<void> {
  if (!isMessengerPersistIdentity(identityId)) return;
  try {
    await getMessengerPersistBackend().delete(identityId);
  } catch {
    return;
  }
}

export async function clearMessengerPersistStore(): Promise<void> {
  try {
    await getMessengerPersistBackend().clear();
  } catch {
    return;
  }
}

export function scheduleMessengerPersistStoreClear(): void {
  void clearMessengerPersistStore();
}

function ensureHydrationGeneration(queryClient: QueryClient, identityId: string): number {
  const ready = readMessengerPersistReadyState();
  if (ready.preparedIdentityId === identityId && !ready.settled) {
    return readMessengerPersistGeneration();
  }
  return beginMessengerPersistHydration(queryClient, identityId);
}

function parseSerializedEnvelope(raw: string, identityId: string): ReturnType<typeof parseMessengerPersistEnvelope> {
  try {
    return parseMessengerPersistEnvelope(JSON.parse(raw), identityId, Date.now());
  } catch {
    return null;
  }
}
