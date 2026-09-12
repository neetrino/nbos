import { afterEach, describe, expect, it, vi } from 'vitest';

const { clearLocaleCookie, signOut } = vi.hoisted(() => ({
  clearLocaleCookie: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/i18n/cookie', () => ({ clearLocaleCookie }));
vi.mock('next-auth/react', () => ({ signOut }));
vi.mock('@/features/messenger/persist/messenger-persist-controller', () => ({
  scheduleMessengerPersistStoreClear: vi.fn(),
}));
vi.mock('@/features/messenger/persist/messenger-persist-session', () => ({
  purgeMessengerPersistForSignOut: vi.fn(),
}));

import { resetSessionSignOutForTests, signOutClient } from './session-sign-out';

describe('signOutClient locale cookie', () => {
  afterEach(() => {
    resetSessionSignOutForTests();
    clearLocaleCookie.mockClear();
    signOut.mockClear();
  });

  it('clears the interface locale cookie before NextAuth sign-out', async () => {
    await signOutClient();
    expect(clearLocaleCookie).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/sign-in' });
  });
});
