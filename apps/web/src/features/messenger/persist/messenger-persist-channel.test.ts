import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { ingestChannelMessage, parseChannelMessage } from './messenger-persist-channel';
import { MESSENGER_CACHE_SCHEMA_VERSION } from './messenger-persist.constants';
import {
  beginMessengerPersistHydration,
  clearMessengerPersistLastSeen,
  noteMessengerPersistCapturedAt,
  readMessengerPersistLastSeenCapturedAt,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';

const IDENTITY = 'employee-user-aaaa';
const OTHER = 'employee-user-bbbb';
const NOW = 1_725_000_000_000;

function message(overrides: Record<string, unknown> = {}) {
  return {
    identityId: IDENTITY,
    capturedAt: NOW - 1_000,
    writtenAt: NOW - 500,
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
    ...overrides,
  };
}

describe('Messenger persist channel freshness', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
  });

  it('accepts the active identity at the current schema and rejects the rest', () => {
    expect(parseChannelMessage(message(), NOW)).toMatchObject({ identityId: IDENTITY });
    expect(parseChannelMessage(message({ identityId: OTHER }), NOW)?.identityId).toBe(OTHER);
    expect(parseChannelMessage(message({ schemaVersion: 1 }), NOW)).toBeNull();
    expect(parseChannelMessage(message({ schemaVersion: 3 }), NOW)).toBeNull();
    expect(
      parseChannelMessage(message({ capturedAt: NOW + 1, writtenAt: NOW + 1 }), NOW),
    ).toBeNull();
    expect(parseChannelMessage(message({ writtenAt: NOW + 1 }), NOW)).toBeNull();
    expect(parseChannelMessage({ identityId: IDENTITY }, NOW)).toBeNull();
  });

  it('ignores other-identity and future messages so they cannot block writes', () => {
    beginMessengerPersistHydration(
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
      IDENTITY,
    );
    expect(ingestChannelMessage(IDENTITY, message({ identityId: OTHER }), NOW)).toBeNull();
    expect(readMessengerPersistLastSeenCapturedAt(IDENTITY)).toBe(0);
    expect(
      ingestChannelMessage(
        IDENTITY,
        message({ capturedAt: NOW + 5_000, writtenAt: NOW + 5_000 }),
        NOW,
      ),
    ).toBeNull();
    expect(readMessengerPersistLastSeenCapturedAt(IDENTITY)).toBe(0);
    expect(ingestChannelMessage(IDENTITY, message(), NOW)).not.toBeNull();
    expect(readMessengerPersistLastSeenCapturedAt(IDENTITY)).toBe(NOW - 1_000);
  });

  it('tracks last-seen capture recency per identity and clears on account switch', () => {
    noteMessengerPersistCapturedAt(OTHER, NOW);
    noteMessengerPersistCapturedAt(IDENTITY, NOW - 5_000);
    expect(readMessengerPersistLastSeenCapturedAt(IDENTITY)).toBe(NOW - 5_000);
    expect(readMessengerPersistLastSeenCapturedAt(OTHER)).toBe(NOW);
    noteMessengerPersistCapturedAt(IDENTITY, NOW - 1_000);
    expect(readMessengerPersistLastSeenCapturedAt(IDENTITY)).toBe(NOW - 1_000);
    expect(readMessengerPersistLastSeenCapturedAt(OTHER)).toBe(NOW);
    clearMessengerPersistLastSeen();
    expect(readMessengerPersistLastSeenCapturedAt(IDENTITY)).toBe(0);
    expect(readMessengerPersistLastSeenCapturedAt(OTHER)).toBe(0);
  });
});
