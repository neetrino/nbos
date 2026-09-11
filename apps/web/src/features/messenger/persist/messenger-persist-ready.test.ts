import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefetchMessengerZoneBootstrap } from './messenger-bootstrap-prefetch';
import {
  cancelMessengerPersistHost,
  beginMessengerPersistHydration,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';
import {
  getMessengerPersistQueryEnabled,
  isMessengerPersistHydrating,
  markMessengerPersistReadySettled,
  registerMessengerPersistHost,
  settleMessengerPersistReadyForTests,
} from './messenger-persist-ready';

const IDENTITY_A = 'employee-user-aaaa';
const IDENTITY_B = 'employee-user-bbbb';
const bootstrapInternal = vi.fn();

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: {
    bootstrap: (...args: unknown[]) => bootstrapInternal(...args),
  },
}));

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: { bootstrap: vi.fn() },
}));

describe('Messenger persist query gate', () => {
  afterEach(() => {
    resetMessengerPersistSessionForTests();
    bootstrapInternal.mockReset();
    delete process.env.NEXT_PUBLIC_MESSENGER_PERSISTENCE;
  });

  it('blocks query execution until the host registers and hydration settles for an identity', async () => {
    const queryFn = vi.fn(async () => ({ ok: true }));
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    expect(isMessengerPersistHydrating()).toBe(true);
    if (getMessengerPersistQueryEnabled()) await queryFn();
    expect(queryFn).not.toHaveBeenCalled();
    registerMessengerPersistHost();
    markMessengerPersistReadySettled();
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    beginMessengerPersistHydration(queryClient, IDENTITY_A);
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    markMessengerPersistReadySettled();
    expect(getMessengerPersistQueryEnabled()).toBe(true);
    if (getMessengerPersistQueryEnabled()) await queryFn();
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('enables queries immediately when persistence is disabled', () => {
    process.env.NEXT_PUBLIC_MESSENGER_PERSISTENCE = '0';
    expect(getMessengerPersistQueryEnabled()).toBe(true);
    expect(isMessengerPersistHydrating()).toBe(false);
  });

  it('re-enters the gate on account switch and is not stuck after a host cancel cycle', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    settleMessengerPersistReadyForTests(IDENTITY_A);
    expect(getMessengerPersistQueryEnabled()).toBe(true);
    beginMessengerPersistHydration(queryClient, IDENTITY_B);
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    markMessengerPersistReadySettled();
    expect(getMessengerPersistQueryEnabled()).toBe(true);
    beginMessengerPersistHydration(queryClient, 'employee-user-cccc');
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    cancelMessengerPersistHost();
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    settleMessengerPersistReadyForTests('employee-user-cccc');
    expect(getMessengerPersistQueryEnabled()).toBe(true);
  });

  it('does not prefetch bootstrap before the persist gate settles', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    expect(prefetchMessengerZoneBootstrap(queryClient, 'INTERNAL')).toBeUndefined();
    expect(bootstrapInternal).not.toHaveBeenCalled();
    settleMessengerPersistReadyForTests();
    bootstrapInternal.mockResolvedValue({ summaries: { items: [] }, collections: [] });
    const pending = prefetchMessengerZoneBootstrap(queryClient, 'INTERNAL');
    expect(pending).toBeDefined();
    await pending;
    expect(bootstrapInternal).toHaveBeenCalledTimes(1);
  });
});
