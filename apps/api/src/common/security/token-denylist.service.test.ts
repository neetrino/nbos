import { describe, it, expect, vi, afterEach } from 'vitest';
import { TokenDenylistService } from './token-denylist.service';

describe('TokenDenylistService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats unknown jti as not revoked', () => {
    const service = new TokenDenylistService();
    expect(service.isRevoked('unknown')).toBe(false);
  });

  it('treats undefined jti as not revoked', () => {
    const service = new TokenDenylistService();
    expect(service.isRevoked(undefined)).toBe(false);
  });

  it('marks a token revoked until its expiry', () => {
    const service = new TokenDenylistService();
    service.revokeUntil('jti-1', Date.now() + 10_000);
    expect(service.isRevoked('jti-1')).toBe(true);
  });

  it('ignores already-expired revocations', () => {
    const service = new TokenDenylistService();
    service.revokeUntil('jti-2', Date.now() - 1_000);
    expect(service.isRevoked('jti-2')).toBe(false);
  });

  it('stops reporting revoked once the token has expired', () => {
    vi.useFakeTimers();
    const service = new TokenDenylistService();
    service.revokeUntil('jti-3', Date.now() + 5_000);
    expect(service.isRevoked('jti-3')).toBe(true);

    vi.advanceTimersByTime(6_000);
    expect(service.isRevoked('jti-3')).toBe(false);
  });
});
