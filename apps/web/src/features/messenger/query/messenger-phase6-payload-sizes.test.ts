import { describe, expect, it } from 'vitest';
import type {
  MessengerWsConversationReadUpdatedPayload,
  MessengerWsConversationSummaryPayload,
} from '@nbos/shared';
import { messengerQueryKeys } from './messenger-query-keys';
import { messengerTestCheckpoint } from './messenger-test-checkpoint';
import { utf8JsonByteLength } from '../persist/messenger-utf8-bytes';
import {
  MESSENGER_CACHE_SCHEMA_VERSION,
  MESSENGER_PERSIST_ENVELOPE_MAX_BYTES,
  MESSENGER_PERSIST_ROWS_PER_QUERY_MAX,
} from '../persist/messenger-persist.constants';
import {
  persistTestCollection,
  persistTestInternalPage,
  persistTestInternalRow,
} from '../persist/messenger-persist-test-dto';

const IDENTITY = 'employee-user-aaaa';
const NOW = 1_725_000_000_000;

function persistEnvelope() {
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
  };
}

function bootstrapFixture() {
  return {
    summaries: persistTestInternalPage('c1'),
    collections: [persistTestCollection()],
    ...messengerTestCheckpoint('4'),
  };
}

function summaryEvent(): MessengerWsConversationSummaryPayload {
  return {
    conversationId: 'c1',
    zone: 'INTERNAL',
    lastMessageAt: '2026-09-05T12:00:00.000Z',
    lastMessagePreview: 'hello',
    unreadCount: 1,
    lastReadAt: null,
  };
}

function readEvent(): MessengerWsConversationReadUpdatedPayload {
  return {
    scope: 'conversation',
    conversationId: 'c1',
    unreadCount: 0,
    zone: 'INTERNAL',
    lastReadAt: '2026-09-05T12:00:00.000Z',
  };
}

describe('Phase 6 Messenger payload UTF-8 sizes', () => {
  it('names the persist envelope budget from two API list pages of max-preview rows', () => {
    expect(MESSENGER_PERSIST_ROWS_PER_QUERY_MAX).toBe(100);
    expect(MESSENGER_PERSIST_ENVELOPE_MAX_BYTES).toBe(2 * 100 * 8192);
  });

  it('reports observed UTF-8 sizes for canonical fixtures (no invented SLA)', () => {
    const envelopeBytes = utf8JsonByteLength(persistEnvelope());
    const bootstrapBytes = utf8JsonByteLength(bootstrapFixture());
    const summaryBytes = utf8JsonByteLength(summaryEvent());
    const readBytes = utf8JsonByteLength(readEvent());
    const maxPageBytes = utf8JsonByteLength({
      items: Array.from({ length: MESSENGER_PERSIST_ROWS_PER_QUERY_MAX }, (_, i) =>
        persistTestInternalRow(`c${i}`),
      ),
      mentionsAvailable: true,
      hasMore: true,
    });
    expect({
      envelopeBytes,
      bootstrapBytes,
      summaryBytes,
      readBytes,
      maxPageBytes,
    }).toEqual({
      envelopeBytes: 915,
      bootstrapBytes: 617,
      summaryBytes: 147,
      readBytes: 120,
      maxPageBytes: 32_541,
    });
    expect(envelopeBytes).toBeLessThan(MESSENGER_PERSIST_ENVELOPE_MAX_BYTES);
    expect(JSON.stringify(persistEnvelope()).length).toBeLessThanOrEqual(envelopeBytes);
  });
});
