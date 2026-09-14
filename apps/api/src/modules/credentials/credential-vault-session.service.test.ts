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

  async function createService(authVersion: number) {
    const findUnique = vi.fn().mockResolvedValue({ authVersion });
    const prisma = { employee: { findUnique } };
    const { CredentialVaultSessionService } = await import('./credential-vault-session.service');
    const service = new CredentialVaultSessionService(prisma as never);
    service.onModuleInit();
    return { service, findUnique };
  }

  it('tracks unlock expiry in memory when Redis is unset', async () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    const { service } = await createService(4);

    expect(await service.isUnlocked('emp-1')).toBe(false);
    const unlocked = await service.unlock('emp-1');
    expect(unlocked.unlocked).toBe(true);
    expect(await service.isUnlocked('emp-1')).toBe(true);

    await service.lock('emp-1');
    expect(await service.isUnlocked('emp-1')).toBe(false);

    if (prev) process.env.REDIS_URL = prev;
  }, 15_000);

  it('ends the vault session when authVersion moved on (logout-all, reset, admin sign-out)', async () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    const { service, findUnique } = await createService(4);

    await service.unlock('emp-1');
    expect(await service.isUnlocked('emp-1')).toBe(true);

    findUnique.mockResolvedValue({ authVersion: 5 });
    expect(await service.isUnlocked('emp-1')).toBe(false);

    if (prev) process.env.REDIS_URL = prev;
  }, 15_000);

  it('treats a deleted employee as locked', async () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    const { service, findUnique } = await createService(4);

    await service.unlock('emp-1');
    findUnique.mockResolvedValue(null);

    expect(await service.isUnlocked('emp-1')).toBe(false);

    if (prev) process.env.REDIS_URL = prev;
  }, 15_000);

  it('does not create a session for an employee that no longer exists', async () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    const { service, findUnique } = await createService(4);
    findUnique.mockResolvedValue(null);

    expect(await service.unlock('gone')).toEqual({ unlocked: false, expiresAt: null });
    expect(await service.isUnlocked('gone')).toBe(false);

    if (prev) process.env.REDIS_URL = prev;
  }, 15_000);
});
