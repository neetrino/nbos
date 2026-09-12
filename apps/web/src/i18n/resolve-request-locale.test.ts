import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, cache: <Fn>(fn: Fn) => fn };
});

vi.mock('./cached-auth-session', () => ({
  getCachedAuthSession: vi.fn(),
}));

vi.mock('./fetch-authenticated-locale', () => ({
  fetchAuthenticatedLocale: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { getCachedAuthSession } from './cached-auth-session';
import { fetchAuthenticatedLocale } from './fetch-authenticated-locale';
import { resolveRequestLocale } from './resolve-request-locale';

function authenticatedSession(id: string): Awaited<ReturnType<typeof getCachedAuthSession>> {
  return {
    user: {
      id,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      accessToken: 'unused-in-session',
    },
    expires: '2099-01-01T00:00:00.000Z',
  };
}

function cookieStore(value?: string) {
  return {
    get: (name: string) => (name === 'nbos-interface-locale' && value ? { value } : undefined),
  };
}

describe('resolveRequestLocale', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('restores saved RU after an expired access token is refreshed', async () => {
    vi.mocked(getCachedAuthSession).mockResolvedValue(authenticatedSession('employee-a'));
    vi.mocked(fetchAuthenticatedLocale).mockResolvedValue('ru');
    vi.mocked(cookies).mockResolvedValue(cookieStore('en') as never);

    await expect(resolveRequestLocale()).resolves.toBe('ru');
    expect(fetchAuthenticatedLocale).toHaveBeenCalledTimes(1);
  });

  it('does not treat an unbound locale cookie as truth when the API is down', async () => {
    vi.mocked(getCachedAuthSession).mockResolvedValue(authenticatedSession('employee-a'));
    vi.mocked(fetchAuthenticatedLocale).mockResolvedValue(null);
    vi.mocked(cookies).mockResolvedValue(cookieStore('ru') as never);

    await expect(resolveRequestLocale()).resolves.toBe('en');
  });

  it('uses the next user profile after another account signs in', async () => {
    vi.mocked(getCachedAuthSession).mockResolvedValue(authenticatedSession('employee-b'));
    vi.mocked(fetchAuthenticatedLocale).mockResolvedValue('en');
    vi.mocked(cookies).mockResolvedValue(cookieStore('ru') as never);

    await expect(resolveRequestLocale()).resolves.toBe('en');
  });

  it('reads a valid cookie only before sign-in', async () => {
    vi.mocked(getCachedAuthSession).mockResolvedValue(null);
    vi.mocked(cookies).mockResolvedValue(cookieStore('ru') as never);

    await expect(resolveRequestLocale()).resolves.toBe('ru');
    expect(fetchAuthenticatedLocale).not.toHaveBeenCalled();
  });
});
