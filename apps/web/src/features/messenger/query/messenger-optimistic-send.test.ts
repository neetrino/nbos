import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { sendInternalThreadMessage } from '@/features/messenger-internal/send-internal-thread-message';
import { applyMessengerPersistSessionIdentity } from '../persist/messenger-persist-boundary';
import { settleMessengerPersistReadyForTests } from '../persist/messenger-persist-ready';
import {
  bindMessengerPersistQueryClient,
  resetMessengerPersistSessionForTests,
} from '../persist/messenger-persist-session';
import { captureMessengerPersistSnapshot } from '../persist/messenger-persist-snapshot';
import {
  persistTestInternalPage,
  persistTestInternalRow,
} from '../persist/messenger-persist-test-dto';
import { applyMessengerRealtimeMessage } from './messenger-cache';
import type { MessengerMessagesPage } from './messenger-cache';
import { messengerQueryKeys } from './messenger-query-keys';
import { resetOptimisticCoreSendState, retryTrackedCoreSend } from './messenger-optimistic-send';
import { noteMessengerComposerDraft } from './messenger-send-claim';

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: { sendMessage: vi.fn() },
}));

const sendMessage = vi.mocked(messengerCoreApi.sendMessage);

const EMPLOYEE_A = 'employee-user-aaaa';
const EMPLOYEE_B = 'employee-user-bbbb';

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function canonical(id: string, content: string, key?: string): MessengerCoreMessageRow {
  return {
    id,
    conversationId: 'c1',
    senderId: 'e1',
    senderName: 'Ada',
    content,
    createdAt: '2026-10-01T12:00:00.000Z',
    editedAt: null,
    direction: 'INTERNAL',
    status: 'SENT',
    idempotencyKey: key,
    attachments: [],
  };
}

function page(queryClient: QueryClient): MessengerCoreMessageRow[] {
  return (
    queryClient.getQueryData<MessengerMessagesPage>(messengerQueryKeys.messages('c1'))?.items ?? []
  );
}

function inboxPreview(queryClient: QueryClient): string | null | undefined {
  const data = queryClient.getQueryData<{ items: Array<{ lastMessagePreview: string | null }> }>(
    messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
  );
  return data?.items[0]?.lastMessagePreview;
}

function seedEmployeeBCache(queryClient: QueryClient): void {
  const row = { ...persistTestInternalRow('c1'), lastMessagePreview: 'from-B' };
  queryClient.setQueryData<MessengerMessagesPage>(messengerQueryKeys.messages('c1'), {
    items: [canonical('b-1', 'from-B')],
    meta: { hasMoreOlder: false },
  });
  queryClient.setQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
    ...persistTestInternalPage('c1'),
    items: [row],
  });
}

function persistedSnapshotText(queryClient: QueryClient, identityId: string): string {
  const snapshot = captureMessengerPersistSnapshot(queryClient, identityId, Date.now());
  return JSON.stringify(snapshot);
}

describe('optimistic core send', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const setNewMessage = vi.fn();

  beforeEach(() => {
    sendMessage.mockReset();
    setNewMessage.mockReset();
    resetOptimisticCoreSendState();
    queryClient.clear();
    resetMessengerPersistSessionForTests();
  });

  afterEach(() => {
    resetMessengerPersistSessionForTests();
  });

  function send(content: string) {
    return sendInternalThreadMessage({
      conversationId: 'c1',
      canWrite: true,
      content,
      extras: {},
      setNewMessage,
      queryClient,
      senderId: 'e1',
      senderName: 'Ada',
    });
  }

  it('does not let a composer lock reject a second send', async () => {
    const gates = ['A', 'B', 'C', 'D'].map(() => deferred<MessengerCoreMessageRow>());
    sendMessage.mockImplementation((_id, body) => {
      const index = ['A', 'B', 'C', 'D'].indexOf(body.content);
      const gate = gates[index];
      if (!gate) throw new Error('unexpected content');
      return gate.promise;
    });
    const pending = ['A', 'B', 'C', 'D'].map((content) => send(content));
    expect(sendMessage).toHaveBeenCalledTimes(4);
    expect(setNewMessage).toHaveBeenCalledTimes(4);
    expect(page(queryClient).map((row) => row.content)).toEqual(['A', 'B', 'C', 'D']);
    const keys = sendMessage.mock.calls.map((call) => call[1].idempotencyKey);
    expect(new Set(keys).size).toBe(4);
    gates.forEach((gate, index) => {
      const key = keys[index];
      gate.resolve(canonical(`srv-${index}`, ['A', 'B', 'C', 'D'][index] ?? '', key));
    });
    await Promise.all(pending);
    expect(page(queryClient)).toHaveLength(4);
  });

  it('retries one logical message with the same idempotency key', async () => {
    sendMessage
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(canonical('srv', 'hello'));
    await send('hello');
    const key = sendMessage.mock.calls[0]?.[1].idempotencyKey;
    expect(setNewMessage).toHaveBeenCalledWith('');
    expect(page(queryClient)).toEqual([
      expect.objectContaining({
        content: 'hello',
        localSend: { idempotencyKey: key, phase: 'failed' },
      }),
    ]);
    expect(page(queryClient)[0]?.status).toBeUndefined();
    await retryTrackedCoreSend(key ?? '');
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage.mock.calls[1]?.[1].idempotencyKey).toBe(key);
    expect(page(queryClient)).toHaveLength(1);
    expect(page(queryClient)[0]?.id).toBe('srv');
    expect(page(queryClient)[0]?.localSend).toBeUndefined();
  });

  it('collapses to one row when the websocket arrives before HTTP', async () => {
    const gate = deferred<MessengerCoreMessageRow>();
    sendMessage.mockReturnValueOnce(gate.promise);
    const pending = send('hello');
    const key = sendMessage.mock.calls[0]?.[1].idempotencyKey ?? '';
    expect(page(queryClient)).toHaveLength(1);
    applyMessengerRealtimeMessage(queryClient, canonical('srv', 'hello', key));
    expect(page(queryClient).map((row) => row.id)).toEqual(['srv']);
    gate.resolve(canonical('srv', 'hello', key));
    await pending;
    expect(page(queryClient)).toHaveLength(1);
    expect(page(queryClient)[0]?.localSend).toBeUndefined();
    expect(page(queryClient)[0]?.id).toBe('srv');
  });

  it('collapses to one row when HTTP arrives before the websocket', async () => {
    sendMessage.mockImplementation((_id, body) =>
      Promise.resolve(canonical('srv', 'hello', body.idempotencyKey)),
    );
    await send('hello');
    const key = sendMessage.mock.calls[0]?.[1].idempotencyKey;
    expect(page(queryClient).map((row) => row.id)).toEqual(['srv']);
    applyMessengerRealtimeMessage(queryClient, canonical('srv', 'hello', key));
    expect(page(queryClient)).toHaveLength(1);
    expect(page(queryClient)[0]?.id).toBe('srv');
    expect(page(queryClient)[0]?.localSend).toBeUndefined();
  });

  it('treats a double-click as the same key and a retyped text as a new one', async () => {
    const gate = deferred<MessengerCoreMessageRow>();
    sendMessage.mockReturnValue(gate.promise);
    const first = send('hello');
    await send('hello');
    expect(sendMessage).toHaveBeenCalledTimes(1);
    const key = sendMessage.mock.calls[0]?.[1].idempotencyKey;
    noteMessengerComposerDraft('c1', 'hello');
    const second = send('hello');
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage.mock.calls[1]?.[1].idempotencyKey).not.toBe(key);
    gate.resolve(canonical('srv-1', 'hello', key));
    await Promise.all([first, second]);
  });

  it('discards a late HTTP result after the signed-in employee changes', async () => {
    bindMessengerPersistQueryClient(queryClient);
    settleMessengerPersistReadyForTests(EMPLOYEE_A);
    const gate = deferred<MessengerCoreMessageRow>();
    sendMessage.mockReturnValueOnce(gate.promise);
    const pending = send('secret-from-A');
    const key = sendMessage.mock.calls[0]?.[1].idempotencyKey;
    applyMessengerPersistSessionIdentity(queryClient, EMPLOYEE_B);
    seedEmployeeBCache(queryClient);
    gate.resolve(canonical('srv-a', 'secret-from-A', key));
    await pending;
    expect(page(queryClient).map((row) => row.content)).toEqual(['from-B']);
    expect(inboxPreview(queryClient)).toBe('from-B');
    const snapshot = persistedSnapshotText(queryClient, EMPLOYEE_B);
    expect(snapshot).toContain('from-B');
    expect(snapshot).not.toContain('secret-from-A');
  });

  it('discards a late HTTP result after sign-out', async () => {
    bindMessengerPersistQueryClient(queryClient);
    settleMessengerPersistReadyForTests(EMPLOYEE_A);
    const gate = deferred<MessengerCoreMessageRow>();
    sendMessage.mockReturnValueOnce(gate.promise);
    const pending = send('secret-from-A');
    applyMessengerPersistSessionIdentity(queryClient, null);
    gate.resolve(
      canonical('srv-a', 'secret-from-A', sendMessage.mock.calls[0]?.[1].idempotencyKey),
    );
    await pending;
    expect(page(queryClient)).toEqual([]);
    expect(persistedSnapshotText(queryClient, EMPLOYEE_A)).toBe('null');
  });

  it('does not write a failed phase after the signed-in employee changes', async () => {
    bindMessengerPersistQueryClient(queryClient);
    settleMessengerPersistReadyForTests(EMPLOYEE_A);
    const gate = deferred<MessengerCoreMessageRow>();
    sendMessage.mockReturnValueOnce(gate.promise);
    const pending = send('secret-from-A');
    applyMessengerPersistSessionIdentity(queryClient, EMPLOYEE_B);
    seedEmployeeBCache(queryClient);
    gate.reject(new Error('timeout'));
    await pending;
    expect(page(queryClient).map((row) => row.content)).toEqual(['from-B']);
    expect(page(queryClient)[0]?.localSend).toBeUndefined();
    expect(inboxPreview(queryClient)).toBe('from-B');
  });

  it('still reconciles when the same employee session is applied again', async () => {
    bindMessengerPersistQueryClient(queryClient);
    settleMessengerPersistReadyForTests(EMPLOYEE_A);
    const gate = deferred<MessengerCoreMessageRow>();
    sendMessage.mockReturnValueOnce(gate.promise);
    const pending = send('hello');
    const key = sendMessage.mock.calls[0]?.[1].idempotencyKey;
    applyMessengerPersistSessionIdentity(queryClient, EMPLOYEE_A);
    gate.resolve(canonical('srv', 'hello', key));
    await pending;
    expect(page(queryClient)).toHaveLength(1);
    expect(page(queryClient)[0]?.id).toBe('srv');
    expect(page(queryClient)[0]?.localSend).toBeUndefined();
  });
});
