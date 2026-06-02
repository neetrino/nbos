import { describe, it, expect, beforeEach, vi } from 'vitest';
import { credentialNeedsVaultUnlock } from './credential-vault-criticality';

describe('credentialNeedsVaultUnlock', () => {
  it('returns false for LOW and MEDIUM', () => {
    expect(credentialNeedsVaultUnlock('LOW')).toBe(false);
    expect(credentialNeedsVaultUnlock('MEDIUM')).toBe(false);
  });

  it('returns true for HIGH and CRITICAL', () => {
    expect(credentialNeedsVaultUnlock('HIGH')).toBe(true);
    expect(credentialNeedsVaultUnlock('CRITICAL')).toBe(true);
  });

  it('returns false when criticality is missing', () => {
    expect(credentialNeedsVaultUnlock(undefined)).toBe(false);
  });
});

describe('CredentialVaultSessionService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('tracks unlock expiry in memory when Redis is unset', async () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    const { CredentialVaultSessionService } = await import('./credential-vault-session.service');
    const service = new CredentialVaultSessionService();
    service.onModuleInit();

    expect(await service.isUnlocked('emp-1')).toBe(false);
    const unlocked = await service.unlock('emp-1');
    expect(unlocked.unlocked).toBe(true);
    expect(await service.isUnlocked('emp-1')).toBe(true);

    await service.lock('emp-1');
    expect(await service.isUnlocked('emp-1')).toBe(false);

    if (prev) process.env.REDIS_URL = prev;
  });
});
