import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./create-server-auth-request', () => ({
  createServerAuthRequest: vi.fn(),
}));

vi.mock('@/lib/auth/ensure-backend-access-token', () => ({
  ensureBackendAccessToken: vi.fn(),
}));

import { NextRequest } from 'next/server';
import { ensureBackendAccessToken } from '@/lib/auth/ensure-backend-access-token';
import { createServerAuthRequest } from './create-server-auth-request';
import { fetchAuthenticatedLocale } from './fetch-authenticated-locale';

function authRequest(): NextRequest {
  return new NextRequest('http://localhost/internal/interface-locale');
}

describe('fetchAuthenticatedLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns null when the session cannot be refreshed', async () => {
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(createServerAuthRequest).mockResolvedValue(authRequest());
    vi.mocked(ensureBackendAccessToken).mockResolvedValue({ kind: 'session-invalid' });

    await expect(fetchAuthenticatedLocale()).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refreshes an expired access token and restores the saved Russian locale', async () => {
    vi.mocked(createServerAuthRequest).mockResolvedValue(authRequest());
    vi.mocked(ensureBackendAccessToken).mockResolvedValue({
      kind: 'available',
      accessToken: 'fresh-access',
      setCookie: 'authjs.session-token=rotated',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { interfaceLocale: 'ru' },
          timestamp: '2026-09-12T00:00:00.000Z',
        }),
      }),
    );

    await expect(fetchAuthenticatedLocale()).resolves.toBe('ru');
    expect(ensureBackendAccessToken).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/me/preferences'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer fresh-access' },
      }),
    );
  });

  it('returns null when the preferences API is unavailable', async () => {
    vi.mocked(createServerAuthRequest).mockResolvedValue(authRequest());
    vi.mocked(ensureBackendAccessToken).mockResolvedValue({
      kind: 'available',
      accessToken: 'fresh-access',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(fetchAuthenticatedLocale()).resolves.toBeNull();
  });

  it('returns null when refresh is only temporarily unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(createServerAuthRequest).mockResolvedValue(authRequest());
    vi.mocked(ensureBackendAccessToken).mockResolvedValue({
      kind: 'temporarily-unavailable',
      status: 503,
    });

    await expect(fetchAuthenticatedLocale()).resolves.toBeNull();
  });
});
