import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { messengerQueryKeys } from './messenger-query-keys';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_READ_WATERMARK_MAX_PER_ZONE,
} from './messenger-query-policy';
import { advanceReadWatermark, getReadWatermark } from './messenger-realtime-watermarks';
import {
  clearAllMessengerHttpCheckpoints,
  readMessengerHttpCheckpoint,
  writeMessengerHttpCheckpoint,
} from './messenger-checkpoint-store';
import { messengerTestCheckpoint } from './messenger-test-checkpoint';
import {
  CANONICAL_PERSISTED_QUERY_FAMILIES,
  persistedMessengerQueryFamily,
} from '../persist/messenger-persist-allowlist';
import {
  MESSENGER_PERSIST_QUERY_COUNT_MAX,
  MESSENGER_PERSIST_ROWS_PER_QUERY_MAX,
} from '../persist/messenger-persist.constants';
import { captureMessengerPersistSnapshot } from '../persist/messenger-persist-snapshot';
import {
  persistTestClientPage,
  persistTestCollection,
  persistTestInternalPage,
} from '../persist/messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('Phase 6 Messenger cache cardinality', () => {
  it('persists exactly four canonical families and caps rows at the API page size', () => {
    expect(CANONICAL_PERSISTED_QUERY_FAMILIES).toHaveLength(4);
    expect(MESSENGER_PERSIST_QUERY_COUNT_MAX).toBe(4);
    expect(MESSENGER_PERSIST_ROWS_PER_QUERY_MAX).toBe(100);
    const queryClient = createClient();
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
      persistTestInternalPage('i1'),
    );
    queryClient.setQueryData(
      messengerQueryKeys.clientSummaries({ section: 'inbox', q: '', filter: 'all', provider: '' }),
      persistTestClientPage('c1'),
    );
    queryClient.setQueryData(messengerQueryKeys.collections('INTERNAL'), [persistTestCollection()]);
    queryClient.setQueryData(messengerQueryKeys.collections('CLIENT'), [
      { ...persistTestCollection('col-c'), zone: 'CLIENT' },
    ]);
    queryClient.setQueryData(messengerQueryKeys.messages('thread-1'), {
      items: [],
      meta: { hasMoreOlder: false },
    });
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({
        source: 'section',
        section: 'tasks',
        q: 'x',
        filter: 'all',
      }),
      persistTestInternalPage('search'),
    );
    const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, Date.now());
    expect(capture?.envelope.queries).toHaveLength(4);
    const families = capture?.envelope.queries.map((row) =>
      persistedMessengerQueryFamily(row.queryKey),
    );
    expect(families).toEqual([...CANONICAL_PERSISTED_QUERY_FAMILIES]);
  });

  it('bounds read watermarks, HTTP checkpoints, and thread gcTime', () => {
    const queryClient = createClient();
    expect(MESSENGER_READ_WATERMARK_MAX_PER_ZONE).toBe(256);
    expect(MESSENGER_QUERY_GC_TIME_MS).toBe(60 * 60 * 1000);
    for (let index = 0; index < MESSENGER_READ_WATERMARK_MAX_PER_ZONE + 8; index += 1) {
      advanceReadWatermark(queryClient, 'INTERNAL', `c${index}`, '2026-09-05T12:00:00.000Z');
    }
    expect(getReadWatermark(queryClient, 'INTERNAL', 'c0')).toBeNull();
    expect(
      getReadWatermark(queryClient, 'INTERNAL', `c${MESSENGER_READ_WATERMARK_MAX_PER_ZONE}`),
    ).toBe('2026-09-05T12:00:00.000Z');
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', messengerTestCheckpoint('1'));
    writeMessengerHttpCheckpoint(queryClient, 'CLIENT', messengerTestCheckpoint('2'));
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')?.checkpoint).toBe('1');
    expect(readMessengerHttpCheckpoint(queryClient, 'CLIENT')?.checkpoint).toBe('2');
    clearAllMessengerHttpCheckpoints(queryClient);
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toBeNull();
  });
});
