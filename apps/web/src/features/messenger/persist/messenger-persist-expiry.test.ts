import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { applyMessengerPersistEnvelope } from './messenger-persist-hydrate';
import { captureMessengerPersistSnapshot } from './messenger-persist-snapshot';
import { parseMessengerPersistEnvelope } from './messenger-persist-envelope';
import {
  beginMessengerPersistHydration,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';
import { MESSENGER_CACHE_SCHEMA_VERSION, MESSENGER_PERSISTENCE_MAX_AGE_MS } from './messenger-persist.constants';
import { persistTestCollection, persistTestInternalPage } from './messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';
const NOW = 1_725_000_000_000;
const FRESH = NOW - 2_000;
const STALE = NOW - MESSENGER_PERSISTENCE_MAX_AGE_MS - 5_000;

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function queryRecord(queryKey: unknown[], dataUpdatedAt: number, data: unknown) {
  return { queryKey, dataUpdatedAt, data };
}

function envelope(queries: ReturnType<typeof queryRecord>[], capturedAt = NOW - 1_000) {
  return {
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
    identityId: IDENTITY,
    capturedAt,
    writtenAt: capturedAt,
    queries,
    checkpoints: {},
  };
}

describe('Messenger persist expired query records', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
  });

  it('captures and restores a fresh summary while omitting a 25h collection', () => {
    const queryClient = createClient();
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
      persistTestInternalPage('fresh-summary'),
      { updatedAt: FRESH },
    );
    queryClient.setQueryData(
      messengerQueryKeys.collections('INTERNAL'),
      [persistTestCollection('old-col')],
      { updatedAt: STALE },
    );
    const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, NOW);
    expect(capture).not.toBeNull();
    if (!capture) return;
    expect(capture.envelope.queries).toHaveLength(1);
    expect(capture.envelope.queries[0]?.queryKey).toEqual([
      ...messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
    ]);
    const parsed = parseMessengerPersistEnvelope(
      { ...capture.envelope, writtenAt: NOW },
      IDENTITY,
      NOW,
    );
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    expect(parsed.queries).toHaveLength(1);
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    queryClient.clear();
    expect(applyMessengerPersistEnvelope(queryClient, parsed, NOW, generation)).toBe(true);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(persistTestInternalPage('fresh-summary'));
    expect(queryClient.getQueryData(messengerQueryKeys.collections('INTERNAL'))).toBeUndefined();
  });

  it('restores a fresh collection when the stored summary row is expired', () => {
    const parsed = parseMessengerPersistEnvelope(
      envelope([
        queryRecord(
          [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
          STALE,
          persistTestInternalPage('old-summary'),
        ),
        queryRecord(
          [...messengerQueryKeys.collections('INTERNAL')],
          FRESH,
          [persistTestCollection('fresh-col')],
        ),
      ]),
      IDENTITY,
      NOW,
    );
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    expect(parsed.queries).toHaveLength(1);
    expect(parsed.queries[0]?.queryKey).toEqual([...messengerQueryKeys.collections('INTERNAL')]);
    const queryClient = createClient();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    expect(applyMessengerPersistEnvelope(queryClient, parsed, NOW, generation)).toBe(true);
    expect(queryClient.getQueryData(messengerQueryKeys.collections('INTERNAL'))).toEqual([
      persistTestCollection('fresh-col'),
    ]);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();
  });

  it('writes nothing when every canonical record is older than 24h', () => {
    const queryClient = createClient();
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
      persistTestInternalPage('old'),
      { updatedAt: STALE },
    );
    queryClient.setQueryData(
      messengerQueryKeys.collections('INTERNAL'),
      [persistTestCollection()],
      { updatedAt: STALE },
    );
    expect(captureMessengerPersistSnapshot(queryClient, IDENTITY, NOW)).toBeNull();
    expect(captureMessengerPersistSnapshot(queryClient, IDENTITY, NOW + 60_000)).toBeNull();
  });

  it('rejects the whole envelope after capturedAt crosses 24h', () => {
    const capturedAt = NOW - MESSENGER_PERSISTENCE_MAX_AGE_MS + 1_000;
    const value = envelope(
      [
        queryRecord(
          [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
          capturedAt - 1,
          persistTestInternalPage('c1'),
        ),
      ],
      capturedAt,
    );
    expect(parseMessengerPersistEnvelope(value, IDENTITY, NOW)).not.toBeNull();
    expect(
      parseMessengerPersistEnvelope(value, IDENTITY, NOW + 2_000),
    ).toBeNull();
  });

  it('rejects the envelope when a companion record is malformed', () => {
    expect(
      parseMessengerPersistEnvelope(
        envelope([
          queryRecord(
            [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
            FRESH,
            persistTestInternalPage('ok'),
          ),
          queryRecord([...messengerQueryKeys.collections('INTERNAL')], FRESH, [{ id: 'col-1' }]),
        ]),
        IDENTITY,
        NOW,
      ),
    ).toBeNull();
    expect(parseMessengerPersistEnvelope(envelope([]), IDENTITY, NOW)).toBeNull();
  });
});
