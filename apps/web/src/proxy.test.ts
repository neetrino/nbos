import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('@/lib/auth/persist-rotated-access-cookie', () => ({
  persistRotatedAccessCookie: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';
import { persistRotatedAccessCookie } from '@/lib/auth/persist-rotated-access-cookie';
import { proxy } from './proxy';

function request(pathname: string): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`);
}

describe('proxy', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('never re-issues the session cookie that holds the rotating refresh token', async () => {
    vi.mocked(getToken).mockResolvedValue({ sessionId: 'session-a' });

    const authenticated = await proxy(request('/dashboard'));
    expect(authenticated.headers.get('set-cookie')).toBeNull();

    vi.mocked(getToken).mockResolvedValue(null);

    const guest = await proxy(request('/dashboard'));
    expect(guest.headers.get('set-cookie')).toBeNull();
  });

  it('sends guests on a protected path to sign-in with the original destination', async () => {
    vi.mocked(getToken).mockResolvedValue(null);

    const response = await proxy(request('/projects/42'));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location') ?? '');
    expect(location.pathname).toBe('/sign-in');
    expect(location.searchParams.get('callbackUrl')).toBe('/projects/42');
  });

  it('keeps guests on public paths and moves signed-in visitors off the landing page', async () => {
    vi.mocked(getToken).mockResolvedValue(null);
    const guestLanding = await proxy(request('/'));
    expect(guestLanding.headers.get('location')).toBeNull();

    vi.mocked(getToken).mockResolvedValue({ sessionId: 'session-a' });
    const signedInLanding = await proxy(request('/'));
    expect(new URL(signedInLanding.headers.get('location') ?? '').pathname).toBe('/dashboard');
  });

  it('reuses the existing BFF persist helper on an authenticated document request', async () => {
    vi.mocked(getToken).mockResolvedValue({ sessionId: 'session-a', accessToken: 'expired' });

    await proxy(request('/dashboard'));

    expect(persistRotatedAccessCookie).toHaveBeenCalledTimes(1);
  });
});
