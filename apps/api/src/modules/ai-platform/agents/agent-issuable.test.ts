import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertAgentNotExpired, assertFutureExpiry, EXPIRY_MUST_BE_FUTURE } from './agent-issuable';

describe('assertAgentNotExpired', () => {
  it('allows a live agent', () => {
    expect(() =>
      assertAgentNotExpired(
        { id: 'a1', status: 'ACTIVE', revokedAt: null, expiresAt: null },
        'expired',
      ),
    ).not.toThrow();
  });

  it('rejects elapsed expiry even when stored status is DISABLED', () => {
    expect(() =>
      assertAgentNotExpired(
        {
          id: 'a1',
          status: 'DISABLED',
          revokedAt: null,
          expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        },
        'expired',
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects stored and computed expiry', () => {
    expect(() =>
      assertAgentNotExpired(
        { id: 'a1', status: 'EXPIRED', revokedAt: null, expiresAt: null },
        'expired',
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      assertAgentNotExpired(
        {
          id: 'a1',
          status: 'ACTIVE',
          revokedAt: null,
          expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        },
        'expired',
      ),
    ).toThrow(BadRequestException);
  });
});

describe('assertFutureExpiry', () => {
  it('rejects a past successor or grant expiry before any write', () => {
    expect(() => assertFutureExpiry(new Date('2020-01-01T00:00:00.000Z'))).toThrow(
      EXPIRY_MUST_BE_FUTURE,
    );
  });

  it('rechecks against a later now after the preliminary check', () => {
    const expiresAt = new Date('2026-08-22T12:00:01.000Z');
    expect(() => assertFutureExpiry(expiresAt, new Date('2026-08-22T12:00:00.000Z'))).not.toThrow();
    expect(() => assertFutureExpiry(expiresAt, new Date('2026-08-22T12:00:02.000Z'))).toThrow(
      EXPIRY_MUST_BE_FUTURE,
    );
  });

  it('allows a missing or future expiry', () => {
    expect(() => assertFutureExpiry(null)).not.toThrow();
    expect(() => assertFutureExpiry(new Date('2099-01-01T00:00:00.000Z'))).not.toThrow();
  });
});
