import type { QueryClient } from '@tanstack/react-query';
import {
  readMessengerHttpCheckpoint,
  type MessengerHttpCheckpoint,
} from '../query/messenger-checkpoint-store';
import type { MessengerZone } from '../query/messenger-query-keys';
import {
  CANONICAL_PERSISTED_QUERY_FAMILIES,
  persistedMessengerQueryFamily,
  type PersistedMessengerQueryFamily,
} from './messenger-persist-allowlist';
import { parsePersistedQueryData } from './messenger-persist-dto';
import type { MessengerPersistEnvelope, MessengerPersistQueryRecord } from './messenger-persist-envelope';
import {
  MESSENGER_CACHE_SCHEMA_VERSION,
  MESSENGER_PERSISTENCE_MAX_AGE_MS,
  MESSENGER_PERSIST_QUERY_COUNT_MAX,
} from './messenger-persist.constants';
import { isValidPersistTimestamp } from './messenger-persist-envelope';
import { clonePlainJson } from './messenger-persist-plain';

export type MessengerPersistCapture = {
  envelope: Omit<MessengerPersistEnvelope, 'writtenAt'>;
  capturedAt: number;
};

export function captureMessengerPersistSnapshot(
  queryClient: QueryClient,
  identityId: string,
  capturedAt: number,
): MessengerPersistCapture | null {
  const queries = collectCanonicalPersistedQueries(queryClient, capturedAt);
  if (queries.length === 0) return null;
  return {
    capturedAt,
    envelope: {
      schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
      identityId,
      capturedAt,
      queries,
      checkpoints: collectPersistedCheckpoints(queryClient),
    },
  };
}

function collectCanonicalPersistedQueries(
  queryClient: QueryClient,
  capturedAt: number,
): MessengerPersistQueryRecord[] {
  const byFamily = new Map<PersistedMessengerQueryFamily, MessengerPersistQueryRecord>();
  for (const query of queryClient.getQueryCache().getAll()) {
    const family = persistedMessengerQueryFamily(query.queryKey);
    if (!family) continue;
    const record = toPersistedQueryRecord(query.queryKey, query.state, capturedAt);
    if (record) byFamily.set(family, record);
  }
  return CANONICAL_PERSISTED_QUERY_FAMILIES.map((family) => byFamily.get(family))
    .filter((record): record is MessengerPersistQueryRecord => record !== undefined)
    .slice(0, MESSENGER_PERSIST_QUERY_COUNT_MAX);
}

function toPersistedQueryRecord(
  queryKey: readonly unknown[],
  state: { status: string; fetchStatus: string; data?: unknown; dataUpdatedAt: number; error: unknown },
  capturedAt: number,
): MessengerPersistQueryRecord | null {
  if (state.status !== 'success' || state.fetchStatus !== 'idle') return null;
  if (state.error || state.data === undefined) return null;
  if (!isValidPersistTimestamp(state.dataUpdatedAt, capturedAt)) return null;
  if (capturedAt - state.dataUpdatedAt > MESSENGER_PERSISTENCE_MAX_AGE_MS) return null;
  const cloned = clonePlainJson(state.data);
  if (cloned === undefined) return null;
  const data = parsePersistedQueryData(queryKey, cloned);
  if (data === null) return null;
  return { queryKey: [...queryKey], dataUpdatedAt: state.dataUpdatedAt, data };
}

function collectPersistedCheckpoints(
  queryClient: QueryClient,
): Partial<Record<MessengerZone, MessengerHttpCheckpoint>> {
  const checkpoints: Partial<Record<MessengerZone, MessengerHttpCheckpoint>> = {};
  for (const zone of ['INTERNAL', 'CLIENT'] as const) {
    const current = readMessengerHttpCheckpoint(queryClient, zone);
    if (current) checkpoints[zone] = current;
  }
  return checkpoints;
}
