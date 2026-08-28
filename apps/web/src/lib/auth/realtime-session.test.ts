import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./session-sign-out', () => ({
  signOutForInvalidSession: vi.fn(),
}));

import { signOutForInvalidSession } from './session-sign-out';
import { recoverRealtimeSession, resetRealtimeSessionRecoveryForTests } from './realtime-session';

describe('recoverRealtimeSession', () => {
  afterEach(() => {
    resetRealtimeSessionRecoveryForTests();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('signs out only when the BFF explicitly confirms an invalid session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(null, {
            status: 401,
            headers: { 'x-nbos-session-invalid': '1' },
          }),
      ),
    );

    await expect(recoverRealtimeSession()).resolves.toEqual({ kind: 'session-invalid' });
    expect(signOutForInvalidSession).toHaveBeenCalledTimes(1);
  });

  it('keeps temporary failures retryable and dedupes simultaneous probes', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([recoverRealtimeSession(), recoverRealtimeSession()]);

    expect(first).toEqual({ kind: 'temporarily-unavailable' });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(signOutForInvalidSession).not.toHaveBeenCalled();
  });
});
