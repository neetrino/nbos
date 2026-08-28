import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { buildLoggerParams, sanitizeLoggedQuery, sanitizeLoggedRequestUrl } from './logger.config';

function getRequestSerializer(): (req: IncomingMessage) => Record<string, unknown> {
  const params = buildLoggerParams();
  const serializer = params.pinoHttp?.serializers?.req;
  if (!serializer) {
    throw new Error('Expected req serializer to be configured');
  }
  return serializer;
}

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

describe('sanitizeLoggedQuery', () => {
  it('redacts code and state', () => {
    const sanitized = sanitizeLoggedQuery({
      code: 'abc123',
      state: 'signed-jwt-value',
    });
    expect(sanitized).toEqual({
      code: '[REDACTED]',
      state: '[REDACTED]',
    });
    expect(JSON.stringify(sanitized)).not.toContain('abc123');
    expect(JSON.stringify(sanitized)).not.toContain('signed-jwt-value');
  });

  it('redacts access_token and client_secret', () => {
    const sanitized = sanitizeLoggedQuery({
      access_token: 'short-token',
      client_secret: 'secret-value',
    });
    expect(sanitized).toEqual({
      access_token: '[REDACTED]',
      client_secret: '[REDACTED]',
    });
    expect(JSON.stringify(sanitized)).not.toContain('short-token');
    expect(JSON.stringify(sanitized)).not.toContain('secret-value');
  });

  it('leaves non-sensitive parameters unchanged', () => {
    const sanitized = sanitizeLoggedQuery({
      platform: 'INSTAGRAM',
      foo: 'bar',
    });
    expect(sanitized).toEqual({
      platform: 'INSTAGRAM',
      foo: 'bar',
    });
  });

  it('does not mutate the input query object', () => {
    const query = {
      code: 'abc123',
      state: 'signed-jwt-value',
      platform: 'INSTAGRAM',
    };
    const snapshot = { ...query };
    sanitizeLoggedQuery(query);
    expect(query).toEqual(snapshot);
  });
});

describe('serializeRequest', () => {
  const serializeRequest = getRequestSerializer();

  it('redacts code and state in req.url', () => {
    const req = {
      method: 'GET',
      url: '/api/integrations/meta/oauth/callback?code=abc123&state=signed-jwt-value',
      headers: {},
      query: {
        code: 'abc123',
        state: 'signed-jwt-value',
      },
    } as IncomingMessage;

    const serialized = serializeRequest(req);
    expect(serialized.url).toBe(
      '/api/integrations/meta/oauth/callback?code=%5BREDACTED%5D&state=%5BREDACTED%5D',
    );
    expect(String(serialized.url)).not.toContain('abc123');
    expect(String(serialized.url)).not.toContain('signed-jwt-value');
  });

  it('redacts code and state in req.query', () => {
    const req = {
      method: 'GET',
      url: '/api/integrations/meta/oauth/callback?code=abc123&state=signed-jwt-value',
      headers: {},
      query: {
        code: 'abc123',
        state: 'signed-jwt-value',
      },
    } as IncomingMessage;

    const serialized = serializeRequest(req);
    expect(serialized.query).toEqual({
      code: '[REDACTED]',
      state: '[REDACTED]',
    });
    expect(JSON.stringify(serialized)).not.toContain('abc123');
    expect(JSON.stringify(serialized)).not.toContain('signed-jwt-value');
  });

  it('redacts access_token and client_secret in req.query', () => {
    const req = {
      method: 'GET',
      url: '/callback?access_token=short-token&client_secret=secret-value&foo=bar',
      headers: {},
      query: {
        access_token: 'short-token',
        client_secret: 'secret-value',
        foo: 'bar',
      },
    } as IncomingMessage;

    const serialized = serializeRequest(req);
    expect(serialized.query).toEqual({
      access_token: '[REDACTED]',
      client_secret: '[REDACTED]',
      foo: 'bar',
    });
    expect(JSON.stringify(serialized)).not.toContain('short-token');
    expect(JSON.stringify(serialized)).not.toContain('secret-value');
  });

  it('leaves non-sensitive req.query parameters unchanged', () => {
    const req = {
      method: 'GET',
      url: '/api/integrations/meta/accounts?platform=INSTAGRAM',
      headers: {},
      query: {
        platform: 'INSTAGRAM',
      },
    } as IncomingMessage;

    const serialized = serializeRequest(req);
    expect(serialized.query).toEqual({
      platform: 'INSTAGRAM',
    });
  });
});

describe('logger redaction paths', () => {
  it('redacts refresh tokens if request-body logging is enabled later', () => {
    const params = buildLoggerParams();
    const redact = params.pinoHttp && 'redact' in params.pinoHttp ? params.pinoHttp.redact : null;
    expect(redact).toEqual(
      expect.objectContaining({ paths: expect.arrayContaining(['req.body.refreshToken']) }),
    );
  });
});
