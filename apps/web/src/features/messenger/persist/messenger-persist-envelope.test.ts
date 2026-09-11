import { describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { isPersistedMessengerQueryKey } from './messenger-persist-allowlist';
import {
  parseMessengerPersistEnvelope,
  type MessengerPersistEnvelope,
} from './messenger-persist-envelope';
import {
  MESSENGER_CACHE_SCHEMA_VERSION,
  MESSENGER_PERSISTENCE_MAX_AGE_MS,
} from './messenger-persist.constants';
import { messengerTestCheckpoint } from '../query/messenger-test-checkpoint';
import {
  persistTestCollection,
  persistTestInternalPage,
  persistTestInternalRow,
} from './messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';
const NOW = 1_725_000_000_000;

function envelope(overrides: Partial<MessengerPersistEnvelope> = {}): MessengerPersistEnvelope {
  return {
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
    identityId: IDENTITY,
    capturedAt: NOW - 1_000,
    writtenAt: NOW - 1_000,
    queries: [
      {
        queryKey: [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
        dataUpdatedAt: NOW - 2_000,
        data: persistTestInternalPage('c1'),
      },
      {
        queryKey: [...messengerQueryKeys.collections('INTERNAL')],
        dataUpdatedAt: NOW - 2_000,
        data: [persistTestCollection()],
      },
    ],
    checkpoints: {
      INTERNAL: {
        checkpoint: '4',
        authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
      },
    },
    ...overrides,
  };
}

describe('Messenger persist envelope validation', () => {
  it('accepts a versioned same-user envelope within 24 hours', () => {
    expect(parseMessengerPersistEnvelope(envelope(), IDENTITY, NOW)).toMatchObject({
      identityId: IDENTITY,
      schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
      capturedAt: NOW - 1_000,
    });
  });

  it('rejects expired, future, malformed, version, and wrong-user envelopes', () => {
    expect(
      parseMessengerPersistEnvelope(
        envelope({
          capturedAt: NOW - MESSENGER_PERSISTENCE_MAX_AGE_MS - 1,
          writtenAt: NOW - 1_000,
        }),
        IDENTITY,
        NOW,
      ),
    ).toBeNull();
    expect(
      parseMessengerPersistEnvelope(
        envelope({ capturedAt: NOW + 1, writtenAt: NOW + 1 }),
        IDENTITY,
        NOW,
      ),
    ).toBeNull();
    expect(parseMessengerPersistEnvelope('{not-json', IDENTITY, NOW)).toBeNull();
    expect(parseMessengerPersistEnvelope(envelope({ schemaVersion: 1 }), IDENTITY, NOW)).toBeNull();
    expect(parseMessengerPersistEnvelope(envelope({ schemaVersion: 3 }), IDENTITY, NOW)).toBeNull();
    expect(parseMessengerPersistEnvelope(envelope(), 'employee-user-bbbb', NOW)).toBeNull();
  });

  it('rejects unsafe families, incomplete pages, and invalid checkpoints', () => {
    const messages = envelope({
      queries: [
        {
          queryKey: [...messengerQueryKeys.messages('conv-1')],
          dataUpdatedAt: NOW - 2_000,
          data: { items: [{ id: 'm1' }] },
        },
      ],
    });
    expect(parseMessengerPersistEnvelope(messages, IDENTITY, NOW)).toBeNull();
    const infinite = envelope({
      queries: [
        {
          queryKey: [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
          dataUpdatedAt: NOW - 2_000,
          data: { pages: [{ items: [persistTestInternalRow()] }], pageParams: [undefined] },
        },
      ],
    });
    expect(parseMessengerPersistEnvelope(infinite, IDENTITY, NOW)).toBeNull();
    const badCheckpoint = envelope({
      checkpoints: { INTERNAL: { checkpoint: 'nope', authorizationEpoch: 'zz'.repeat(16) } },
    });
    expect(parseMessengerPersistEnvelope(badCheckpoint, IDENTITY, NOW)).toBeNull();
  });

  it('allowlists only summaries and collection lists', () => {
    expect(
      isPersistedMessengerQueryKey(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBe(true);
    expect(isPersistedMessengerQueryKey(messengerQueryKeys.collections('CLIENT'))).toBe(true);
    expect(
      isPersistedMessengerQueryKey(
        messengerQueryKeys.internalSummaries({
          source: 'section',
          section: 'tasks',
          q: 'secret',
          filter: 'all',
        }),
      ),
    ).toBe(false);
    expect(
      isPersistedMessengerQueryKey(
        messengerQueryKeys.clientSummaries({
          section: 'inbox',
          q: 'lead',
          filter: 'all',
          provider: '',
        }),
      ),
    ).toBe(false);
    expect(isPersistedMessengerQueryKey(messengerQueryKeys.messages('conv-1'))).toBe(false);
    expect(
      isPersistedMessengerQueryKey(messengerQueryKeys.collectionDetail('INTERNAL', 'col-1')),
    ).toBe(false);
    expect(isPersistedMessengerQueryKey(messengerQueryKeys.internalEntity('TASK', 't1'))).toBe(
      false,
    );
  });
});
