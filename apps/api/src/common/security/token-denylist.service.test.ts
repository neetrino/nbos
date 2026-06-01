import { describe, it, expect, vi, afterEach } from 'vitest';
import { TokenDenylistService } from './token-denylist.service';

describe('TokenDenylistService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats unknown jti as not revoked', async () => {
    const service = new TokenDenylistService();
    await expect(service.isRevoked('unknown')).resolves.toBe(false);
  });

  it('treats undefined jti as not revoked', async () => {
    const service = new TokenDenylistService();
    await expect(service.isRevoked(undefined)).resolves.toBe(false);
  });

  it('marks a token revoked until its expiry', async () => {
    const service = new TokenDenylistService();
    await service.revokeUntil('jti-1', Date.now() + 10_000);
    await expect(service.isRevoked('jti-1')).resolves.toBe(true);
  });

  it('ignores already-expired revocations', async () => {
    const service = new TokenDenylistService();
    await service.revokeUntil('jti-2', Date.now() - 1_000);
    await expect(service.isRevoked('jti-2')).resolves.toBe(false);
  });

  it('stops reporting revoked once the token has expired', async () => {
    vi.useFakeTimers();
    const service = new TokenDenylistService();
    await service.revokeUntil('jti-3', Date.now() + 5_000);
    await expect(service.isRevoked('jti-3')).resolves.toBe(true);

    vi.advanceTimersByTime(6_000);
    await expect(service.isRevoked('jti-3')).resolves.toBe(false);
  });
});
