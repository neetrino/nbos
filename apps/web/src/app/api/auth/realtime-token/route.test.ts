import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/ensure-backend-access-token', () => ({
  ensureBackendAccessToken: vi.fn(),
}));

import { ensureBackendAccessToken } from '@/lib/auth/ensure-backend-access-token';
import { GET } from './route';

function request(): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/realtime-token');
}

describe('GET /api/auth/realtime-token', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the current token and applies a rotated Auth.js cookie', async () => {
    vi.mocked(ensureBackendAccessToken).mockResolvedValue({
      kind: 'available',
      accessToken: 'fresh-access',
      setCookie: 'authjs.session-token=rotated; HttpOnly',
    });

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ token: 'fresh-access' });
    expect(response.headers.get('set-cookie')).toContain('authjs.session-token=rotated');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('marks a confirmed invalid session but not a temporary refresh failure', async () => {
    vi.mocked(ensureBackendAccessToken).mockResolvedValueOnce({ kind: 'session-invalid' });
    const invalid = await GET(request());
    expect(invalid.status).toBe(401);
    expect(invalid.headers.get('x-nbos-session-invalid')).toBe('1');

    vi.mocked(ensureBackendAccessToken).mockResolvedValueOnce({
      kind: 'temporarily-unavailable',
      status: 503,
    });
    const temporary = await GET(request());
    expect(temporary.status).toBe(503);
    expect(temporary.headers.get('x-nbos-session-invalid')).toBeNull();
  });
});
