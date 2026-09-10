import type { QueryClient } from '@tanstack/react-query';
import { restoreMessengerHttpCheckpoint } from '../query/messenger-checkpoint-store';
import {
  isMessengerPersistGenerationCurrent,
  readMessengerPersistChannelIdentity,
  readMessengerPersistGate,
} from './messenger-persist-session';
import type { MessengerPersistEnvelope, MessengerPersistQueryRecord } from './messenger-persist-envelope';

export function applyMessengerPersistEnvelope(
  queryClient: QueryClient,
  envelope: MessengerPersistEnvelope,
  hydrationStartedAt: number,
  generation: number,
): boolean {
  if (!isMessengerPersistGenerationCurrent(generation)) return false;
  if (readMessengerPersistChannelIdentity() !== envelope.identityId) return false;
  const gate = readMessengerPersistGate(queryClient);
  if (gate.identityId !== envelope.identityId) return false;
  for (const record of envelope.queries) {
    if (!shouldApplyRestoredQuery(queryClient, record, hydrationStartedAt)) continue;
    queryClient.setQueryData(record.queryKey, record.data, { updatedAt: record.dataUpdatedAt });
  }
  restorePersistedCheckpoints(queryClient, envelope);
  return true;
}

export function shouldApplyRestoredQuery(
  queryClient: QueryClient,
  record: MessengerPersistQueryRecord,
  hydrationStartedAt: number,
): boolean {
  const state = queryClient.getQueryState(record.queryKey);
  if (!state || state.data === undefined) return true;
  if (state.dataUpdatedAt >= record.dataUpdatedAt) return false;
  if (state.dataUpdatedAt >= hydrationStartedAt) return false;
  if (state.fetchStatus === 'fetching') return false;
  return true;
}

function restorePersistedCheckpoints(
  queryClient: QueryClient,
  envelope: MessengerPersistEnvelope,
): void {
  const internal = envelope.checkpoints.INTERNAL;
  const client = envelope.checkpoints.CLIENT;
  if (internal) restoreMessengerHttpCheckpoint(queryClient, 'INTERNAL', internal);
  if (client) restoreMessengerHttpCheckpoint(queryClient, 'CLIENT', client);
}
