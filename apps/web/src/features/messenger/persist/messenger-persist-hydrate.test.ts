import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { messengerTestCheckpoint } from '../query/messenger-test-checkpoint';
import { applyMessengerPersistEnvelope, shouldApplyRestoredQuery } from './messenger-persist-hydrate';
import {
  beginMessengerPersistHydration,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';
import { MESSENGER_CACHE_SCHEMA_VERSION } from './messenger-persist.constants';
import type { MessengerPersistEnvelope } from './messenger-persist-envelope';
import { persistTestInternalPage } from './messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function restoredEnvelope(): MessengerPersistEnvelope {
  const capturedAt = Date.now() - 1_000;
  return {
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
    identityId: IDENTITY,
    capturedAt,
    writtenAt: capturedAt,
    queries: [
      {
        queryKey: [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
        dataUpdatedAt: Date.now() - 60_000,
        data: persistTestInternalPage('restored'),
      },
    ],
    checkpoints: {
      INTERNAL: {
        checkpoint: '4',
        authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
      },
    },
  };
}

describe('Messenger persist hydration races', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
  });

  it('restores summaries before a network fetch when the cache is empty', () => {
    const queryClient = createClient();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    const envelope = restoredEnvelope();
    expect(applyMessengerPersistEnvelope(queryClient, envelope, Date.now(), generation)).toBe(true);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(persistTestInternalPage('restored'));
  });

  it('does not let a late restore overwrite newer HTTP or realtime cache', () => {
    const queryClient = createClient();
    const hydrationStartedAt = Date.now();
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    const key = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });
    queryClient.setQueryData(key, persistTestInternalPage('network'));
    const envelope = restoredEnvelope();
    const first = envelope.queries[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(shouldApplyRestoredQuery(queryClient, first, hydrationStartedAt)).toBe(false);
    applyMessengerPersistEnvelope(queryClient, envelope, hydrationStartedAt, generation);
    expect(queryClient.getQueryData(key)).toEqual(persistTestInternalPage('network'));
  });

  it('ignores restore after logout generation bump', () => {
    const queryClient = createClient();
    const staleGeneration = beginMessengerPersistHydration(queryClient, IDENTITY);
    beginMessengerPersistHydration(queryClient, IDENTITY);
    expect(applyMessengerPersistEnvelope(queryClient, restoredEnvelope(), Date.now(), staleGeneration)).toBe(
      false,
    );
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();
  });
});
