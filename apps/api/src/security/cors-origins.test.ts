import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { assertCorsOriginsSafeForProduction, parseCorsOriginsFromEnv } from './cors-origins';

describe('cors-origins', () => {
  const originalCorsOrigin = process.env.CORS_ORIGIN;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.CORS_ORIGIN;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalCorsOrigin === undefined) delete process.env.CORS_ORIGIN;
    else process.env.CORS_ORIGIN = originalCorsOrigin;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it('parses comma-separated origins and defaults in dev', () => {
    expect(parseCorsOriginsFromEnv()).toEqual(['http://localhost:3000']);
    process.env.CORS_ORIGIN = 'https://a.com, https://b.com ';
    expect(parseCorsOriginsFromEnv()).toEqual(['https://a.com', 'https://b.com']);
  });

  it('assertCorsOriginsSafeForProduction is a no-op outside production', () => {
    process.env.NODE_ENV = 'development';
    expect(() => assertCorsOriginsSafeForProduction([])).not.toThrow();
    expect(() => assertCorsOriginsSafeForProduction(['*'])).not.toThrow();
  });

  it('assertCorsOriginsSafeForProduction rejects empty or wildcard in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => assertCorsOriginsSafeForProduction([])).toThrow(/CORS_ORIGIN/);
    expect(() => assertCorsOriginsSafeForProduction(['*'])).toThrow(/explicit allowlist/);
    expect(() => assertCorsOriginsSafeForProduction(['https://app.example.com'])).not.toThrow();
  });
});
