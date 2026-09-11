import { describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import {
  parsePersistedClientSummaryParams,
  parsePersistedInternalSummaryParams,
  parsePersistedQueryData,
} from './messenger-persist-dto';
import { parseMessengerPersistEnvelope } from './messenger-persist-envelope';
import { clonePlainJson } from './messenger-persist-plain';
import {
  MESSENGER_CACHE_SCHEMA_VERSION,
  MESSENGER_PERSIST_PREVIEW_MAX_CHARS,
} from './messenger-persist.constants';
import {
  persistTestClientPage,
  persistTestCollection,
  persistTestInternalPage,
  persistTestInternalRow,
} from './messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';
const NOW = 1_725_000_000_000;

describe('Messenger persist exact DTO schema', () => {
  it('rejects nested secret/token/provider fields and unknown query params', () => {
    const poisoned = {
      ...persistTestInternalRow(),
      accessToken: 'secret-token',
      providerPayload: { token: 'nested-secret' },
    };
    expect(
      parsePersistedQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
        items: [poisoned],
        mentionsAvailable: true,
      }),
    ).toBeNull();
    expect(parsePersistedInternalSummaryParams({ source: 'all-dataset', extra: true })).toBeNull();
    expect(
      parsePersistedClientSummaryParams({ section: 'inbox', q: '', filter: 'all' }),
    ).toBeNull();
  });

  it('rejects malformed DTO fields and collection extras', () => {
    expect(
      parsePersistedQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
        items: [{ id: 'c1' }],
        mentionsAvailable: true,
      }),
    ).toBeNull();
    expect(
      parsePersistedQueryData(messengerQueryKeys.collections('INTERNAL'), [
        { ...persistTestCollection(), items: [{ conversationId: 'c1' }], conversations: [] },
      ]),
    ).toBeNull();
  });

  it('rejects prototype-shaped rows and does not hydrate them', () => {
    const proto = Object.assign(
      Object.create({ accessToken: 'proto-secret' }),
      persistTestInternalRow(),
    );
    expect(
      parsePersistedQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
        items: [proto],
        mentionsAvailable: true,
      }),
    ).toBeNull();
    expect(
      parseMessengerPersistEnvelope(
        {
          schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
          identityId: IDENTITY,
          capturedAt: NOW - 1_000,
          writtenAt: NOW - 1_000,
          queries: [
            {
              queryKey: [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
              dataUpdatedAt: NOW - 2_000,
              data: persistTestInternalPage(),
            },
          ],
          checkpoints: {},
          accessToken: 'nope',
        },
        IDENTITY,
        NOW,
      ),
    ).toBeNull();
  });

  it('rejects oversized list pages and non-plain serialization', () => {
    const oversized = persistTestInternalRow('big');
    const huge = {
      items: [
        { ...oversized, lastMessagePreview: 'x'.repeat(MESSENGER_PERSIST_PREVIEW_MAX_CHARS + 1) },
      ],
      mentionsAvailable: true,
    };
    expect(
      parsePersistedQueryData(
        messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
        huge,
      ),
    ).toBeNull();
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(clonePlainJson(cyclic)).toBeUndefined();
    expect(clonePlainJson(new Date())).toBeUndefined();
    expect(clonePlainJson({ ok: true })).toEqual({ ok: true });
    expect(
      parsePersistedQueryData(
        messengerQueryKeys.clientSummaries({
          section: 'inbox',
          q: '',
          filter: 'all',
          provider: '',
        }),
        persistTestClientPage(),
      ),
    ).not.toBeNull();
  });
});
