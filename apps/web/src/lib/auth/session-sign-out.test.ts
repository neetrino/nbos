import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { createMemoryMessengerPersistBackend } from '@/features/messenger/persist/messenger-persist-idb';
import { persistTestCollection } from '@/features/messenger/persist/messenger-persist-test-dto';
import { setMessengerPersistBackendForTests } from '@/features/messenger/persist/messenger-persist-controller';
import { captureMessengerPersistSnapshot } from '@/features/messenger/persist/messenger-persist-snapshot';
import { commitMessengerPersistCapture } from '@/features/messenger/persist/messenger-persist-write';
import {
  beginMessengerPersistHydration,
  bindMessengerPersistQueryClient,
  resetMessengerPersistSessionForTests,
} from '@/features/messenger/persist/messenger-persist-session';
import { resetSessionSignOutForTests, signOutClient } from './session-sign-out';

const { signOut } = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next-auth/react', () => ({ signOut }));

const IDENTITY = 'employee-user-aaaa';

describe('signOutClient Messenger purge', () => {
  afterEach(() => {
    resetSessionSignOutForTests();
    resetMessengerPersistSessionForTests();
    setMessengerPersistBackendForTests(null);
    signOut.mockClear();
  });

  it('empties memory immediately and does not wait for hung storage clear', async () => {
    const backend = createMemoryMessengerPersistBackend(
      { [IDENTITY]: '{"schemaVersion":2}' },
      { afterRead: () => new Promise(() => undefined) },
    );
    backend.clear = () => new Promise(() => undefined);
    setMessengerPersistBackendForTests(backend);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    bindMessengerPersistQueryClient(queryClient);
    queryClient.setQueryData(messengerQueryKeys.collections('INTERNAL'), [persistTestCollection()]);
    const pending = signOutClient();
    expect(queryClient.getQueryData(messengerQueryKeys.collections('INTERNAL'))).toBeUndefined();
    await pending;
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/sign-in' });
  });

  it('continues NextAuth when storage clear rejects and shares one sign-out', async () => {
    setMessengerPersistBackendForTests({
      read: async () => null,
      write: async () => undefined,
      compareAndWrite: async () => false,
      delete: async () => undefined,
      clear: async () => {
        throw new Error('idb');
      },
    });
    const first = signOutClient();
    const second = signOutClient();
    await Promise.all([first, second]);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('rejects a delayed pre-logout write after the generation purge', async () => {
    let release: () => void = () => undefined;
    const latch = new Promise<void>((resolve) => {
      release = resolve;
    });
    const backend = createMemoryMessengerPersistBackend(undefined, { afterRead: () => latch });
    setMessengerPersistBackendForTests(backend);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    bindMessengerPersistQueryClient(queryClient);
    const generation = beginMessengerPersistHydration(queryClient, IDENTITY);
    const now = Date.now();
    queryClient.setQueryData(
      messengerQueryKeys.collections('INTERNAL'),
      [persistTestCollection()],
      { updatedAt: now - 1 },
    );
    const capture = captureMessengerPersistSnapshot(queryClient, IDENTITY, now);
    expect(capture).not.toBeNull();
    if (!capture) return;
    const write = commitMessengerPersistCapture(backend, capture, IDENTITY, generation, null);
    await Promise.resolve();
    const pending = signOutClient();
    expect(queryClient.getQueryData(messengerQueryKeys.collections('INTERNAL'))).toBeUndefined();
    release();
    expect(await write).toBe(false);
    await pending;
    expect(await backend.read(IDENTITY)).toBeNull();
  });
});
