import { describe, expect, it } from 'vitest';
import { sanitizeLoggedRequestUrl } from './logger.config';

describe('sanitizeLoggedRequestUrl', () => {
  it('redacts OAuth code and state from Meta callback URLs', () => {
    const sanitized = sanitizeLoggedRequestUrl(
      '/api/integrations/meta/oauth/callback?code=abc123&state=signed-jwt-value',
    );
    expect(sanitized).toBe(
      '/api/integrations/meta/oauth/callback?code=%5BREDACTED%5D&state=%5BREDACTED%5D',
    );
    expect(sanitized).not.toContain('abc123');
    expect(sanitized).not.toContain('signed-jwt-value');
  });

  it('leaves URLs without sensitive query params unchanged', () => {
    const url = '/api/integrations/meta/accounts';
    expect(sanitizeLoggedRequestUrl(url)).toBe(url);
  });

  it('redacts access_token and client_secret from query strings', () => {
    const sanitized = sanitizeLoggedRequestUrl(
      '/callback?access_token=short-token&client_secret=secret-value&foo=bar',
    );
    expect(sanitized).toContain('access_token=%5BREDACTED%5D');
    expect(sanitized).toContain('client_secret=%5BREDACTED%5D');
    expect(sanitized).toContain('foo=bar');
    expect(sanitized).not.toContain('short-token');
    expect(sanitized).not.toContain('secret-value');
  });
});
