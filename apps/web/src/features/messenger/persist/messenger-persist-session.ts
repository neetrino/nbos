import type { QueryClient } from '@tanstack/react-query';
import { clearAllMessengerHttpCheckpoints } from '../query/messenger-checkpoint-store';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import {
  MESSENGER_PERSIST_IDENTITY_PATTERN,
  resetMessengerPersistEnabledForTests,
} from './messenger-persist.constants';
import {
  markMessengerPersistReadySettled,
  resetMessengerPersistReadyForTests,
  unregisterMessengerPersistHost,
  writeMessengerPersistReadyIdentities,
} from './messenger-persist-ready';

export type MessengerPersistGate = {
  generation: number;
  identityId: string | null;
};

type GateListener = () => void;

const gates = new WeakMap<QueryClient, MessengerPersistGate>();
const listeners = new WeakMap<QueryClient, Set<GateListener>>();
const lastSeenCapturedAt = new Map<string, number>();

let generation = 0;
let boundQueryClient: QueryClient | null = null;
let persistChannelIdentity: string | null = null;

export function bindMessengerPersistQueryClient(queryClient: QueryClient | null): void {
  boundQueryClient = queryClient;
}

export function readMessengerPersistGate(queryClient: QueryClient): MessengerPersistGate {
  return gates.get(queryClient) ?? { generation: 0, identityId: null };
}

export function subscribeMessengerPersistGate(
  queryClient: QueryClient,
  listener: GateListener,
): () => void {
  const current = listeners.get(queryClient) ?? new Set<GateListener>();
  current.add(listener);
  listeners.set(queryClient, current);
  return () => {
    current.delete(listener);
  };
}

export function revokeMessengerPersistGeneration(): number {
  generation += 1;
  persistChannelIdentity = null;
  clearMessengerPersistLastSeen();
  return generation;
}

export function installMessengerPersistSessionGate(
  queryClient: QueryClient,
  identityId: string,
  options: { persistable: boolean; settled: boolean },
): void {
  persistChannelIdentity = options.persistable ? identityId : null;
  writeMessengerPersistReadyIdentities({
    preparedIdentityId: identityId,
    sessionIdentityId: identityId,
    settled: options.settled,
  });
  writeGate(queryClient, { generation, identityId });
}

export function beginMessengerPersistHydration(
  queryClient: QueryClient,
  identityId: string,
): number {
  revokeMessengerPersistGeneration();
  installMessengerPersistSessionGate(queryClient, identityId, {
    persistable: isMessengerPersistIdentity(identityId),
    settled: false,
  });
  return generation;
}

export function settleMessengerPersistHydration(
  queryClient: QueryClient,
  expectedGeneration: number,
): void {
  const gate = gates.get(queryClient);
  if (!gate || gate.generation !== expectedGeneration) return;
  markMessengerPersistReadySettled();
}

export function isMessengerPersistGenerationCurrent(expected: number): boolean {
  return expected === generation;
}

export function readMessengerPersistGeneration(): number {
  return generation;
}

export function noteMessengerPersistCapturedAt(identityId: string, capturedAt: number): void {
  const current = lastSeenCapturedAt.get(identityId) ?? 0;
  if (capturedAt > current) lastSeenCapturedAt.set(identityId, capturedAt);
}

export function readMessengerPersistLastSeenCapturedAt(identityId: string): number {
  return lastSeenCapturedAt.get(identityId) ?? 0;
}

export function readMessengerPersistChannelIdentity(): string | null {
  return persistChannelIdentity;
}

export function clearMessengerPersistLastSeen(): void {
  lastSeenCapturedAt.clear();
}

export function isMessengerPersistIdentity(value: string): boolean {
  return MESSENGER_PERSIST_IDENTITY_PATTERN.test(value);
}

export function cancelMessengerPersistHost(): void {
  generation += 1;
  persistChannelIdentity = null;
  unregisterMessengerPersistHost();
}

export function purgeMessengerPersistForSignOut(): void {
  generation += 1;
  persistChannelIdentity = null;
  clearMessengerPersistLastSeen();
  writeMessengerPersistReadyIdentities({
    preparedIdentityId: null,
    sessionIdentityId: null,
    settled: false,
  });
  const queryClient = boundQueryClient;
  if (!queryClient) return;
  queryClient.removeQueries({ queryKey: messengerQueryKeys.root });
  clearAllMessengerHttpCheckpoints(queryClient);
  writeGate(queryClient, { generation, identityId: null });
}

export function resetMessengerPersistSessionForTests(): void {
  generation = 0;
  boundQueryClient = null;
  persistChannelIdentity = null;
  clearMessengerPersistLastSeen();
  resetMessengerPersistEnabledForTests();
  resetMessengerPersistReadyForTests();
}

function writeGate(queryClient: QueryClient, gate: MessengerPersistGate): void {
  gates.set(queryClient, gate);
  listeners.get(queryClient)?.forEach((listener) => listener());
}
