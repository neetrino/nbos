import type { PrismaClient } from '@nbos/database';
import { resolveDbPoolRuntimeConfig } from '@nbos/database';

type ReadyState = { ok: boolean; checkedAt: number };

let cache: ReadyState | null = null;

/**
 * Cached `SELECT 1` for readiness probes — avoids hammering Neon on every Coolify check.
 */
export async function checkPrismaReadiness(
  prisma: InstanceType<typeof PrismaClient>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ ok: boolean; cached: boolean }> {
  const cfg = resolveDbPoolRuntimeConfig(env);
  const now = Date.now();
  if (cache && now - cache.checkedAt < cfg.readinessCacheMs) {
    return { ok: cache.ok, cached: true };
  }

  const timeoutMs = cfg.readinessTimeoutMs;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('DB_READINESS_TIMEOUT')), timeoutMs);
      }),
    ]);
    cache = { ok: true, checkedAt: now };
    return { ok: true, cached: false };
  } catch {
    cache = { ok: false, checkedAt: now };
    return { ok: false, cached: false };
  }
}

/** Test helper */
export function resetPrismaReadinessCache(): void {
  cache = null;
}
