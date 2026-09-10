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
import { MESSENGER_PERSIST_QUERY_COUNT_MAX } from './messenger-persist.constants';
import {
  persistTestClientPage,
  persistTestCollection,
  persistTestInternalPage,
} from './messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('Messenger persist canonical restore keys', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
  });

  it('keeps default inboxes and collections when newer search variants crowd the cache', () => {
    const queryClient = createClient();
    const older = Date.now() - 60_000;
    const newer = Date.now() - 1_000;
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
      persistTestInternalPage('base-internal'),
      { updatedAt: older },
    );
    queryClient.setQueryData(
      messengerQueryKeys.clientSummaries({ section: 'inbox', q: '', filter: 'all', provider: '' }),
      persistTestClientPage('base-client'),
      { updatedAt: older },
    );
    queryClient.setQueryData(
      messengerQueryKeys.collections('INTERNAL'),
      [persistTestCollection('col-int')],
      { updatedAt: older },
    );
    queryClient.setQueryData(
      messengerQueryKeys.collections('CLIENT'),
      [{ ...persistTestCollection('col-client'), zone: 'CLIENT' as const }],
      { updatedAt: older },
    );
    for (let index = 0; index < 18; index += 1) {
      queryClient.setQueryData(
        messengerQueryKeys.internalSummaries({
          source: 'section',
          section: 'tasks',
          q: `search-term-${index}`,
          filter: 'unread',
        }),
        persistTestInternalPage(`search-${index}`),
        { updatedAt: newer + index },
      );
      queryClient.setQueryData(
        messengerQueryKeys.clientSummaries({
          section: 'sales',
          q: `lead-${index}`,
          filter: 'unread',
          provider: 'WHATSAPP',
        }),
        persistTestClientPage(`lead-${index}`),
        { updatedAt: newer + index },
      );
    }
    const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, Date.now());
    expect(capture).not.toBeNull();
    if (!capture) return;
    expect(capture.envelope.queries).toHaveLength(MESSENGER_PERSIST_QUERY_COUNT_MAX);
    const serialized = JSON.stringify(capture.envelope);
    expect(serialized).not.toContain('search-term');
    expect(serialized).not.toContain('lead-');
    expect(capture.envelope.queries.map((record) => record.queryKey)).toEqual([
      [...messengerQueryKeys.internalSummaries({ source: 'all-dataset' })],
      [...messengerQueryKeys.clientSummaries({ section: 'inbox', q: '', filter: 'all', provider: '' })],
      [...messengerQueryKeys.collections('INTERNAL')],
      [...messengerQueryKeys.collections('CLIENT')],
    ]);
    const parsed = parseMessengerPersistEnvelope(
      { ...capture.envelope, writtenAt: capture.capturedAt },
      IDENTITY,
      Date.now(),
    );
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    queryClient.removeQueries({ queryKey: messengerQueryKeys.root });
    expect(applyMessengerPersistEnvelope(queryClient, parsed, Date.now(), generation)).toBe(true);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(persistTestInternalPage('base-internal'));
    expect(
      queryClient.getQueryData(
        messengerQueryKeys.clientSummaries({ section: 'inbox', q: '', filter: 'all', provider: '' }),
      ),
    ).toEqual(persistTestClientPage('base-client'));
  });
});
