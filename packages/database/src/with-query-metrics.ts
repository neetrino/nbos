import type { PrismaClient } from './generated/prisma/client';
import { recordDbQuery } from './query-metrics';
import { resolveDbPoolRuntimeConfig } from './db-pool-env';
import type { DbPoolRole } from './db-pool-env';

/**
 * Soft query instrumentation via $extends. Safe for production when metrics disabled
 * (still tracks in-memory counters only when enabled path runs record).
 */
export function withQueryMetrics(
  client: PrismaClient,
  role: DbPoolRole,
  env: NodeJS.ProcessEnv = process.env,
): PrismaClient {
  const cfg = resolveDbPoolRuntimeConfig(env);

  const extended = client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const started = Date.now();
          let status: 'ok' | 'error' = 'ok';
          try {
            return await query(args);
          } catch (err) {
            status = 'error';
            throw err;
          } finally {
            recordDbQuery({
              role,
              model: model ?? 'unknown',
              operation,
              durationMs: Date.now() - started,
              status,
              slowThresholdMs: cfg.slowQueryThresholdMs,
              sampleRate: cfg.querySampleRate,
              metricsEnabled: cfg.queryMetricsEnabled,
            });
          }
        },
      },
    },
  });

  return extended as unknown as PrismaClient;
}
