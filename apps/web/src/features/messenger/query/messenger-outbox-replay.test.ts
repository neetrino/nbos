import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from './messenger-query-keys';
import {
  noteMessengerOutboxHydrated,
  noteMessengerSocketReady,
  resetMessengerOutboxReplayForTests,
  setMessengerOutboxReplayPortsForTests,
  type MessengerOutboxReplayPorts,
} from './messenger-outbox-replay';
import { failedLocalSendKey } from './messenger-local-send';
import { MESSENGER_CACHE_SCHEMA_VERSION } from '../persist/messenger-persist.constants';
import { captureMessengerPersistSnapshot } from '../persist/messenger-persist-snapshot';
import {
  beginMessengerPersistHydration,
  bindMessengerPersistQueryClient,
  cancelMessengerPersistHost,
  resetMessengerPersistSessionForTests,
} from '../persist/messenger-persist-session';
import {
  hydrateMessengerPersistCache,
  importMessengerPersistOutbox,
  persistMessengerCacheNow,
  setMessengerPersistBackendForTests,
} from '../persist/messenger-persist-controller';
import { createMemoryMessengerPersistBackend } from '../persist/messenger-persist-idb';
import { resetMessengerPersistReadyForTests } from '../persist/messenger-persist-ready';
import type { MessengerPersistOutboxEntry } from '../persist/messenger-persist-outbox';
import { applyMessengerPersistSessionIdentity } from '../persist/messenger-persist-boundary';
import {
  clearMessengerOutboxMemory,
  noteMessengerOutboxCapturedAt,
  readMessengerOutbox,
  shouldAdoptRemoteMessengerOutbox,
  upsertMessengerOutboxEntry,
} from '../persist/messenger-outbox-store';

const IDENTITY = 'employee-user-aaaa';
const OTHER = 'employee-user-bbbb';
const KEY = 'idem-key-1111';
const CREATED = '2026-10-01T12:00:00.000Z';

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function entry(overrides: Partial<MessengerPersistOutboxEntry> = {}): MessengerPersistOutboxEntry {
  return {
    idempotencyKey: KEY,
    conversationId: 'conversation-1',
    zone: 'INTERNAL',
    content: 'pending-hello',
    senderId: 'employee-1',
    senderName: 'Ada',
    createdAt: CREATED,
    replay: 'internal',
    ...overrides,
  };
}

function canonical(key: string): MessengerCoreMessageRow {
  return {
    id: 'srv-1',
    conversationId: 'conversation-1',
    senderId: 'employee-1',
    senderName: 'Ada',
    content: 'pending-hello',
    createdAt: CREATED,
    editedAt: null,
    idempotencyKey: key,
    direction: 'INTERNAL',
    attachments: [],
  };
}

describe('Messenger offline outbox', () => {
  afterEach(() => {
    resetMessengerOutboxReplayForTests();
    resetMessengerPersistSessionForTests();
    resetMessengerPersistReadyForTests();
    setMessengerPersistBackendForTests(null);
  });

  it('does not transmit an internal replay when write access is denied', async () => {
    const transmit = vi.fn();
    setMessengerOutboxReplayPortsForTests({
      authorizeInternal: async () => 'deny',
      transmitInternal: transmit,
    });
    const queryClient = await reloadOutbox(entry());
    noteMessengerSocketReady(queryClient);
    await vi.waitFor(() => expect(readMessengerOutbox(IDENTITY)[0]?.replay).toBe('withhold'));
    expect(transmit).not.toHaveBeenCalled();
  });

  it('does not replay a task-pending conversation id', async () => {
    const transmit = vi.fn();
    installPorts(transmit);
    const queryClient = await reloadOutbox(entry({ conversationId: 'task-pending:task-1' }));
    noteMessengerSocketReady(queryClient);
    await Promise.resolve();
    expect(transmit).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(messengerQueryKeys.messages('conversation-1'))).toBeUndefined();
  });

  it('replays one reloaded internal send with the same idempotency key', async () => {
    const transmit = vi.fn(async (row: MessengerPersistOutboxEntry) => ({
      message: canonical(row.idempotencyKey),
      conversationId: row.conversationId,
    }));
    installPorts(transmit);
    const queryClient = await reloadOutbox(entry());
    expect(threadContents(queryClient)).toContain('pending-hello');
    noteMessengerSocketReady(queryClient);
    noteMessengerSocketReady(queryClient);
    await vi.waitFor(() => expect(transmit).toHaveBeenCalledTimes(1));
    expect(transmit.mock.calls[0]?.[0].idempotencyKey).toBe(KEY);
  });

  it('does not resend a reloaded client pending send', async () => {
    const transmit = vi.fn();
    installPorts(transmit);
    const queryClient = await reloadOutbox(
      entry({ zone: 'CLIENT', replay: 'withhold', content: 'client-hold' }),
    );
    noteMessengerSocketReady(queryClient);
    await Promise.resolve();
    expect(transmit).not.toHaveBeenCalled();
    const row = threadRows(queryClient)[0];
    expect(row?.status).toBe('OUTCOME_UNKNOWN');
    expect(row?.content).toBe('client-hold');
    if (!row) throw new Error('missing restored row');
    expect(failedLocalSendKey(row)).toBeNull();
  });

  it('drops the previous user outbox on logout and account switch', async () => {
    const transmit = vi.fn();
    installPorts(transmit);
    const queryClient = createClient();
    bindMessengerPersistQueryClient(queryClient);
    beginMessengerPersistHydration(queryClient, IDENTITY);
    upsertMessengerOutboxEntry(IDENTITY, entry({ content: 'secret-from-A' }));
    applyMessengerPersistSessionIdentity(queryClient, null);
    noteMessengerOutboxHydrated(queryClient);
    noteMessengerSocketReady(queryClient);
    await Promise.resolve();
    expect(transmit).not.toHaveBeenCalled();
    expect(readMessengerOutbox(IDENTITY)).toEqual([]);

    beginMessengerPersistHydration(queryClient, IDENTITY);
    upsertMessengerOutboxEntry(IDENTITY, entry({ content: 'secret-from-A' }));
    applyMessengerPersistSessionIdentity(queryClient, OTHER);
    noteMessengerOutboxHydrated(queryClient);
    noteMessengerSocketReady(queryClient);
    await Promise.resolve();
    expect(transmit).not.toHaveBeenCalled();
    expect(JSON.stringify(queryClient.getQueryCache().getAll())).not.toContain('secret-from-A');
  });

  it('lets the next employee hydrate and record after an account switch', async () => {
    const transmit = vi.fn(async (row: MessengerPersistOutboxEntry) => ({
      message: canonical(row.idempotencyKey),
      conversationId: row.conversationId,
    }));
    installPorts(transmit);
    const queryClient = createClient();
    bindMessengerPersistQueryClient(queryClient);
    const saved = entry({
      idempotencyKey: 'idem-key-bbbb',
      content: 'saved-from-B',
      senderName: 'Bea',
    });
    setMessengerPersistBackendForTests(
      createMemoryMessengerPersistBackend({ [OTHER]: outboxEnvelope(OTHER, saved) }),
    );
    beginMessengerPersistHydration(queryClient, IDENTITY);
    upsertMessengerOutboxEntry(IDENTITY, entry({ content: 'secret-from-A' }));
    cancelMessengerPersistHost();
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY);
    expect(readMessengerOutbox(IDENTITY).map((row) => row.content)).toEqual(['secret-from-A']);
    applyMessengerPersistSessionIdentity(queryClient, OTHER);
    await hydrateMessengerPersistCache(queryClient, OTHER);
    upsertMessengerOutboxEntry(
      OTHER,
      entry({ idempotencyKey: 'idem-key-cccc', content: 'new-from-B', senderName: 'Bea' }),
    );
    expect(readMessengerOutbox(OTHER).map((row) => row.content)).toEqual([
      'saved-from-B',
      'new-from-B',
    ]);
    const snapshot = captureMessengerPersistSnapshot(queryClient, OTHER, Date.now());
    expect(JSON.stringify(snapshot)).not.toContain('secret-from-A');
    expect(JSON.stringify(queryClient.getQueryCache().getAll())).not.toContain('secret-from-A');
    noteMessengerOutboxHydrated(queryClient);
    noteMessengerSocketReady(queryClient);
    await vi.waitFor(() => expect(transmit).toHaveBeenCalledTimes(2));
    expect(transmit.mock.calls.map((call) => call[0]?.idempotencyKey)).not.toContain(KEY);
    applyMessengerPersistSessionIdentity(queryClient, null);
    expect(readMessengerOutbox(OTHER)).toEqual([]);
  });

  it('does not write an in-flight replay ack after an account switch', async () => {
    let releaseAck: (row: {
      message: MessengerCoreMessageRow;
      conversationId: string;
    }) => void = () => undefined;
    const transmit = vi.fn(
      () =>
        new Promise<{ message: MessengerCoreMessageRow; conversationId: string }>((resolve) => {
          releaseAck = resolve;
        }),
    );
    installPorts(transmit);
    const queryClient = await reloadOutbox(entry({ content: 'secret-from-A' }));
    noteMessengerSocketReady(queryClient);
    await vi.waitFor(() => expect(transmit).toHaveBeenCalledTimes(1));
    applyMessengerPersistSessionIdentity(queryClient, OTHER);
    releaseAck({
      message: { ...canonical(KEY), content: 'secret-from-A' },
      conversationId: 'conversation-1',
    });
    await Promise.resolve();
    expect(JSON.stringify(queryClient.getQueryCache().getAll())).not.toContain('secret-from-A');
  });

  it('lets a second tab see an unacknowledged internal send without a second socket', async () => {
    const queryClient = createClient();
    bindMessengerPersistQueryClient(queryClient);
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    setMessengerPersistBackendForTests(createMemoryMessengerPersistBackend());
    upsertMessengerOutboxEntry(IDENTITY, entry({ content: 'from-tab-a' }));
    expect(await persistMessengerCacheNow(queryClient, IDENTITY, generation, null)).toBe(true);
    clearMessengerOutboxMemory();
    queryClient.clear();
    beginMessengerPersistHydration(queryClient, IDENTITY);
    await importMessengerPersistOutbox(queryClient, IDENTITY);
    expect(threadContents(queryClient)).toContain('from-tab-a');
  });

  it('ignores an older peer outbox announcement', () => {
    noteMessengerOutboxCapturedAt(20);
    expect(shouldAdoptRemoteMessengerOutbox(20)).toBe(false);
    expect(shouldAdoptRemoteMessengerOutbox(21)).toBe(true);
  });
});

function installPorts(transmit: MessengerOutboxReplayPorts['transmitInternal']): void {
  setMessengerOutboxReplayPortsForTests({
    authorizeInternal: async () => 'allow',
    transmitInternal: transmit,
  });
}

async function reloadOutbox(row: MessengerPersistOutboxEntry): Promise<QueryClient> {
  const queryClient = createClient();
  bindMessengerPersistQueryClient(queryClient);
  setMessengerPersistBackendForTests(createMemoryMessengerPersistBackend());
  const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
  upsertMessengerOutboxEntry(IDENTITY, row);
  expect(await persistMessengerCacheNow(queryClient, IDENTITY, generation, null)).toBe(true);
  clearMessengerOutboxMemory();
  queryClient.clear();
  resetMessengerPersistReadyForTests();
  await hydrateMessengerPersistCache(queryClient, IDENTITY);
  return queryClient;
}

function threadRows(queryClient: QueryClient): MessengerCoreMessageRow[] {
  const page = queryClient.getQueryData<{ items: MessengerCoreMessageRow[] }>(
    messengerQueryKeys.messages('conversation-1'),
  );
  return page?.items ?? [];
}

function threadContents(queryClient: QueryClient): string[] {
  return threadRows(queryClient).map((row) => row.content);
}

function outboxEnvelope(identityId: string, row: MessengerPersistOutboxEntry): string {
  const capturedAt = Date.now() - 1_000;
  return JSON.stringify({
    schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
    identityId,
    capturedAt,
    writtenAt: capturedAt,
    queries: [],
    checkpoints: {},
    outbox: [row],
  });
}
