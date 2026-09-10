import { z } from 'zod';
import { parseMessengerHttpCheckpoint } from '../query/messenger-checkpoint-store';
import type { MessengerHttpCheckpoint } from '../query/messenger-checkpoint-store';
import type { MessengerZone } from '../query/messenger-query-keys';
import { isPersistedMessengerQueryKey } from './messenger-persist-allowlist';
import { parsePersistedQueryData } from './messenger-persist-dto';
import {
  MESSENGER_CACHE_SCHEMA_VERSION,
  MESSENGER_PERSISTENCE_MAX_AGE_MS,
  MESSENGER_PERSIST_ENVELOPE_MAX_BYTES,
  MESSENGER_PERSIST_IDENTITY_PATTERN,
  MESSENGER_PERSIST_QUERY_COUNT_MAX,
} from './messenger-persist.constants';
import { isPlainRecord } from './messenger-persist-plain';
import { utf8JsonByteLength } from './messenger-utf8-bytes';

export type MessengerPersistQueryRecord = {
  queryKey: unknown[];
  dataUpdatedAt: number;
  data: unknown;
};

export type MessengerPersistEnvelope = {
  schemaVersion: number;
  identityId: string;
  capturedAt: number;
  writtenAt: number;
  queries: MessengerPersistQueryRecord[];
  checkpoints: Partial<Record<MessengerZone, MessengerHttpCheckpoint>>;
};

const checkpointSchema = z.object({
  checkpoint: z.string(),
  authorizationEpoch: z.string(),
}).strict();

const envelopeHeaderSchema = z
  .object({
    schemaVersion: z.number().int(),
    identityId: z.string(),
    capturedAt: z.number().finite(),
    writtenAt: z.number().finite(),
    queries: z.array(z.unknown()),
    checkpoints: z
      .object({
        INTERNAL: checkpointSchema.optional(),
        CLIENT: checkpointSchema.optional(),
      })
      .strict(),
  })
  .strict();

export function parseMessengerPersistEnvelope(
  value: unknown,
  expectedIdentityId: string,
  now: number,
): MessengerPersistEnvelope | null {
  if (!isPlainRecord(value)) return null;
  const parsed = envelopeHeaderSchema.safeParse(value);
  if (!parsed.success) return null;
  const header = parsed.data;
  if (header.schemaVersion !== MESSENGER_CACHE_SCHEMA_VERSION) return null;
  if (!MESSENGER_PERSIST_IDENTITY_PATTERN.test(header.identityId)) return null;
  if (header.identityId !== expectedIdentityId) return null;
  if (!isValidPersistTimestamp(header.capturedAt, now)) return null;
  if (!isValidPersistTimestamp(header.writtenAt, now)) return null;
  if (header.writtenAt < header.capturedAt) return null;
  if (now - header.capturedAt > MESSENGER_PERSISTENCE_MAX_AGE_MS) return null;
  if (header.queries.length === 0 || header.queries.length > MESSENGER_PERSIST_QUERY_COUNT_MAX) return null;
  const queries = parseEnvelopeQueries(header.queries, header.capturedAt, now);
  if (!queries) return null;
  const checkpoints = parsePersistCheckpoints(header.checkpoints);
  if (!checkpoints) return null;
  const envelope: MessengerPersistEnvelope = {
    schemaVersion: header.schemaVersion,
    identityId: header.identityId,
    capturedAt: header.capturedAt,
    writtenAt: header.writtenAt,
    queries,
    checkpoints,
  };
  if (jsonSize(envelope) > MESSENGER_PERSIST_ENVELOPE_MAX_BYTES) return null;
  return envelope;
}

export function isValidPersistTimestamp(value: number, now: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= now;
}

function parseEnvelopeQueries(
  records: unknown[],
  capturedAt: number,
  now: number,
): MessengerPersistQueryRecord[] | null {
  const queries: MessengerPersistQueryRecord[] = [];
  for (const record of records) {
    const parsed = classifyEnvelopeQueryRecord(record, capturedAt, now);
    if (parsed.kind === 'reject') return null;
    if (parsed.kind === 'omit') continue;
    queries.push(parsed.record);
  }
  return queries.length === 0 ? null : queries;
}

function classifyEnvelopeQueryRecord(
  value: unknown,
  capturedAt: number,
  now: number,
):
  | { kind: 'keep'; record: MessengerPersistQueryRecord }
  | { kind: 'omit' }
  | { kind: 'reject' } {
  if (!isPlainRecord(value)) return { kind: 'reject' };
  const extraKeys = Object.keys(value).filter((key) => !['queryKey', 'dataUpdatedAt', 'data'].includes(key));
  if (extraKeys.length > 0) return { kind: 'reject' };
  if (!Array.isArray(value.queryKey)) return { kind: 'reject' };
  if (typeof value.dataUpdatedAt !== 'number' || !isValidPersistTimestamp(value.dataUpdatedAt, now)) {
    return { kind: 'reject' };
  }
  const dataUpdatedAt = value.dataUpdatedAt;
  if (dataUpdatedAt > capturedAt) return { kind: 'reject' };
  if (!isPersistedMessengerQueryKey(value.queryKey)) return { kind: 'reject' };
  const data = parsePersistedQueryData(value.queryKey, value.data);
  if (data === null) return { kind: 'reject' };
  if (now - dataUpdatedAt > MESSENGER_PERSISTENCE_MAX_AGE_MS) return { kind: 'omit' };
  return { kind: 'keep', record: { queryKey: [...value.queryKey], dataUpdatedAt, data } };
}

function parsePersistCheckpoints(
  value: MessengerPersistEnvelope['checkpoints'],
): MessengerPersistEnvelope['checkpoints'] | null {
  const next: MessengerPersistEnvelope['checkpoints'] = {};
  for (const zone of ['INTERNAL', 'CLIENT'] as const) {
    const candidate = value[zone];
    if (!candidate) continue;
    const parsed = parseMessengerHttpCheckpoint(candidate);
    if (!parsed) return null;
    next[zone] = parsed;
  }
  return next;
}

function jsonSize(value: unknown): number {
  return utf8JsonByteLength(value);
}
