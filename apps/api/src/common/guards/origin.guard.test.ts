import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { OriginGuard } from './origin.guard';

function createContext(method: string, headers: Record<string, string> = {}): ExecutionContext {
  const request = { method, headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('OriginGuard', () => {
  const originalCors = process.env.CORS_ORIGIN;

  beforeEach(() => {
    process.env.CORS_ORIGIN = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env.CORS_ORIGIN = originalCors;
  });

  it('allows GET without origin', () => {
    const guard = new OriginGuard();
    expect(guard.canActivate(createContext('GET'))).toBe(true);
  });

  it('allows POST without origin (non-browser client)', () => {
    const guard = new OriginGuard();
    expect(guard.canActivate(createContext('POST'))).toBe(true);
  });

  it('allows POST from allowed origin', () => {
    const guard = new OriginGuard();
    expect(guard.canActivate(createContext('POST', { origin: 'http://localhost:3000' }))).toBe(
      true,
    );
  });

  it('blocks POST from disallowed origin', () => {
    const guard = new OriginGuard();
    expect(() => guard.canActivate(createContext('POST', { origin: 'https://evil.test' }))).toThrow(
      ForbiddenException,
    );
  });

  it('accepts referer when origin is missing', () => {
    const guard = new OriginGuard();
    expect(
      guard.canActivate(createContext('PATCH', { referer: 'http://localhost:3000/finance' })),
    ).toBe(true);
  });
});
