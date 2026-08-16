import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { assertRefreshCsrf } from './auth-session.csrf';

describe('assertRefreshCsrf', () => {
  const prev = process.env.CORS_ORIGIN;

  beforeEach(() => {
    process.env.CORS_ORIGIN = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env.CORS_ORIGIN = prev;
  });

  it('rejects missing Origin for cookie-only refresh', () => {
    expect(() => assertRefreshCsrf({ hasBodyToken: false })).toThrow(ForbiddenException);
  });

  it('rejects invalid Origin', () => {
    expect(() =>
      assertRefreshCsrf({
        origin: 'https://evil.example',
        hasBodyToken: true,
      }),
    ).toThrow(ForbiddenException);
  });

  it('allows valid same-site Origin', () => {
    expect(() =>
      assertRefreshCsrf({
        origin: 'http://localhost:3000',
        hasBodyToken: false,
      }),
    ).not.toThrow();
  });

  it('allows BFF request with body token', () => {
    expect(() =>
      assertRefreshCsrf({
        bffHeader: '1',
        hasBodyToken: true,
      }),
    ).not.toThrow();
  });
});
