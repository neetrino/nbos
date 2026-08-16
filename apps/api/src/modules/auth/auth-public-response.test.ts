import { describe, expect, it } from 'vitest';
import { toAuthPublicResponse } from './auth-public-response';
import type { LoginResult } from './auth.service';

describe('toAuthPublicResponse', () => {
  it('omits refreshToken from public payload', () => {
    const result: LoginResult = {
      accessToken: 'access-1',
      refreshToken: 'session.secret-value',
      sessionId: 'session-1',
      tokenVersion: 2,
      user: {
        id: 'emp-1',
        email: 'a@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
      },
    };

    const publicResponse = toAuthPublicResponse(result);

    expect(publicResponse).toEqual({
      accessToken: 'access-1',
      sessionId: 'session-1',
      tokenVersion: 2,
      user: result.user,
    });
    expect(publicResponse).not.toHaveProperty('refreshToken');
    expect(JSON.stringify(publicResponse)).not.toContain('secret-value');
  });

  it('preserves legacy V1 shape without sessionId', () => {
    const result: LoginResult = {
      accessToken: 'legacy-access',
      tokenVersion: 1,
      user: {
        id: 'emp-2',
        email: 'b@example.com',
        firstName: 'Grace',
        lastName: 'Hopper',
      },
    };

    expect(toAuthPublicResponse(result)).toEqual({
      accessToken: 'legacy-access',
      tokenVersion: 1,
      user: result.user,
    });
  });
});
