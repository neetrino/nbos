import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { checkPrismaReadiness, resetPrismaReadinessCache } from './db-readiness';

describe('checkPrismaReadiness', () => {
  beforeEach(() => {
    resetPrismaReadinessCache();
    process.env.DB_READINESS_CACHE_MS = '5000';
    process.env.DB_READINESS_TIMEOUT_MS = '2000';
  });

  afterEach(() => {
    resetPrismaReadinessCache();
    delete process.env.DB_READINESS_CACHE_MS;
    delete process.env.DB_READINESS_TIMEOUT_MS;
  });

  it('caches successful SELECT 1', async () => {
    const queryRaw = vi.fn(async () => [{ '?column?': 1 }]);
    const prisma = { $queryRaw: queryRaw } as never;
    const first = await checkPrismaReadiness(prisma);
    const second = await checkPrismaReadiness(prisma);
    expect(first.ok).toBe(true);
    expect(first.cached).toBe(false);
    expect(second.ok).toBe(true);
    expect(second.cached).toBe(true);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns not ok on timeout', async () => {
    process.env.DB_READINESS_TIMEOUT_MS = '20';
    const prisma = {
      $queryRaw: () => new Promise(() => undefined),
    } as never;
    const result = await checkPrismaReadiness(prisma);
    expect(result.ok).toBe(false);
  });
});
