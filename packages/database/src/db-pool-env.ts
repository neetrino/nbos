/**
 * Strict env parsing for Prisma / pg pool settings (no silent NaN fallbacks).
 */

export type DbPoolRole = 'api' | 'worker' | 'scheduler' | 'all';

export type DbPoolRuntimeConfig = {
  poolMax: number;
  poolTimeoutSec: number;
  connectTimeoutSec: number;
  statementTimeoutMs: number;
  slowQueryThresholdMs: number;
  querySampleRate: number;
  queryMetricsEnabled: boolean;
  readinessCacheMs: number;
  readinessTimeoutMs: number;
  totalConnectionBudget: number | null;
  reservedConnections: number;
  apiReplicaCount: number;
  workerReplicaCount: number;
  schedulerReplicaCount: number;
  schedulerMaxConcurrentRuns: number;
};

const DEFAULTS = {
  DB_POOL_MAX_API: 5,
  DB_POOL_MAX_WORKER: 4,
  DB_POOL_MAX_SCHEDULER: 2,
  DB_POOL_TIMEOUT_SEC: 10,
  DB_CONNECT_TIMEOUT_SEC: 10,
  DB_STATEMENT_TIMEOUT_MS: 30_000,
  DB_SLOW_QUERY_THRESHOLD_MS: 500,
  DB_QUERY_SAMPLE_RATE: 0.01,
  DB_READINESS_CACHE_MS: 5_000,
  DB_READINESS_TIMEOUT_MS: 2_000,
  DB_RESERVED_CONNECTIONS: 4,
  API_REPLICA_COUNT: 1,
  WORKER_REPLICA_COUNT: 1,
  SCHEDULER_REPLICA_COUNT: 1,
  SCHEDULER_MAX_CONCURRENT_RUNS: 2,
} as const;

const BOUNDS = {
  poolMax: { min: 1, max: 50 },
  timeoutSec: { min: 1, max: 120 },
  statementTimeoutMs: { min: 1_000, max: 300_000 },
  slowQueryMs: { min: 50, max: 60_000 },
  sampleRate: { min: 0, max: 1 },
  readinessMs: { min: 0, max: 60_000 },
  replicas: { min: 1, max: 100 },
  reserved: { min: 0, max: 100 },
  budget: { min: 1, max: 10_000 },
  schedulerRuns: { min: 1, max: 32 },
} as const;

function parseStrictInt(
  raw: string | undefined,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  if (!/^-?\d+$/.test(raw.trim())) {
    throw new Error(`Invalid ${key}="${raw}": must be an integer`);
  }
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Invalid ${key}=${n}: must be ${min}..${max}`);
  }
  return n;
}

function parseStrictFloat(
  raw: string | undefined,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`Invalid ${key}="${raw}": must be a number ${min}..${max}`);
  }
  return n;
}

function parseFlag(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return fallback;
  const v = raw.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  throw new Error(`Invalid boolean flag="${raw}"`);
}

export function resolvePoolMaxForRole(
  role: DbPoolRole,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const api = parseStrictInt(
    env.DB_POOL_MAX_API,
    'DB_POOL_MAX_API',
    DEFAULTS.DB_POOL_MAX_API,
    BOUNDS.poolMax.min,
    BOUNDS.poolMax.max,
  );
  const worker = parseStrictInt(
    env.DB_POOL_MAX_WORKER,
    'DB_POOL_MAX_WORKER',
    DEFAULTS.DB_POOL_MAX_WORKER,
    BOUNDS.poolMax.min,
    BOUNDS.poolMax.max,
  );
  const scheduler = parseStrictInt(
    env.DB_POOL_MAX_SCHEDULER,
    'DB_POOL_MAX_SCHEDULER',
    DEFAULTS.DB_POOL_MAX_SCHEDULER,
    BOUNDS.poolMax.min,
    BOUNDS.poolMax.max,
  );
  if (role === 'worker') return worker;
  if (role === 'scheduler') return scheduler;
  if (role === 'api') return api;
  // Local PROCESS_ROLE=all: use API pool (single process).
  return api;
}

export function resolveDbPoolRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): DbPoolRuntimeConfig {
  const budgetRaw = env.DB_TOTAL_CONNECTION_BUDGET?.trim();
  let totalConnectionBudget: number | null = null;
  if (budgetRaw) {
    if (!/^\d+$/.test(budgetRaw)) {
      throw new Error(`Invalid DB_TOTAL_CONNECTION_BUDGET="${budgetRaw}": must be an integer`);
    }
    const n = Number(budgetRaw);
    if (!Number.isInteger(n) || n < BOUNDS.budget.min || n > BOUNDS.budget.max) {
      throw new Error(
        `Invalid DB_TOTAL_CONNECTION_BUDGET=${n}: must be ${BOUNDS.budget.min}..${BOUNDS.budget.max}`,
      );
    }
    totalConnectionBudget = n;
  }

  return {
    poolMax: 0, // filled by caller via resolvePoolMaxForRole
    poolTimeoutSec: parseStrictInt(
      env.DB_POOL_TIMEOUT_SEC,
      'DB_POOL_TIMEOUT_SEC',
      DEFAULTS.DB_POOL_TIMEOUT_SEC,
      BOUNDS.timeoutSec.min,
      BOUNDS.timeoutSec.max,
    ),
    connectTimeoutSec: parseStrictInt(
      env.DB_CONNECT_TIMEOUT_SEC,
      'DB_CONNECT_TIMEOUT_SEC',
      DEFAULTS.DB_CONNECT_TIMEOUT_SEC,
      BOUNDS.timeoutSec.min,
      BOUNDS.timeoutSec.max,
    ),
    statementTimeoutMs: parseStrictInt(
      env.DB_STATEMENT_TIMEOUT_MS,
      'DB_STATEMENT_TIMEOUT_MS',
      DEFAULTS.DB_STATEMENT_TIMEOUT_MS,
      BOUNDS.statementTimeoutMs.min,
      BOUNDS.statementTimeoutMs.max,
    ),
    slowQueryThresholdMs: parseStrictInt(
      env.DB_SLOW_QUERY_THRESHOLD_MS,
      'DB_SLOW_QUERY_THRESHOLD_MS',
      DEFAULTS.DB_SLOW_QUERY_THRESHOLD_MS,
      BOUNDS.slowQueryMs.min,
      BOUNDS.slowQueryMs.max,
    ),
    querySampleRate: parseStrictFloat(
      env.DB_QUERY_SAMPLE_RATE,
      'DB_QUERY_SAMPLE_RATE',
      DEFAULTS.DB_QUERY_SAMPLE_RATE,
      BOUNDS.sampleRate.min,
      BOUNDS.sampleRate.max,
    ),
    queryMetricsEnabled: parseFlag(env.DB_QUERY_METRICS_ENABLED, false),
    readinessCacheMs: parseStrictInt(
      env.DB_READINESS_CACHE_MS,
      'DB_READINESS_CACHE_MS',
      DEFAULTS.DB_READINESS_CACHE_MS,
      BOUNDS.readinessMs.min,
      BOUNDS.readinessMs.max,
    ),
    readinessTimeoutMs: parseStrictInt(
      env.DB_READINESS_TIMEOUT_MS,
      'DB_READINESS_TIMEOUT_MS',
      DEFAULTS.DB_READINESS_TIMEOUT_MS,
      BOUNDS.readinessMs.min,
      BOUNDS.readinessMs.max,
    ),
    totalConnectionBudget,
    reservedConnections: parseStrictInt(
      env.DB_RESERVED_CONNECTIONS,
      'DB_RESERVED_CONNECTIONS',
      DEFAULTS.DB_RESERVED_CONNECTIONS,
      BOUNDS.reserved.min,
      BOUNDS.reserved.max,
    ),
    apiReplicaCount: parseStrictInt(
      env.API_REPLICA_COUNT,
      'API_REPLICA_COUNT',
      DEFAULTS.API_REPLICA_COUNT,
      BOUNDS.replicas.min,
      BOUNDS.replicas.max,
    ),
    workerReplicaCount: parseStrictInt(
      env.WORKER_REPLICA_COUNT,
      'WORKER_REPLICA_COUNT',
      DEFAULTS.WORKER_REPLICA_COUNT,
      BOUNDS.replicas.min,
      BOUNDS.replicas.max,
    ),
    schedulerReplicaCount: parseStrictInt(
      env.SCHEDULER_REPLICA_COUNT,
      'SCHEDULER_REPLICA_COUNT',
      DEFAULTS.SCHEDULER_REPLICA_COUNT,
      BOUNDS.replicas.min,
      BOUNDS.replicas.max,
    ),
    schedulerMaxConcurrentRuns: parseStrictInt(
      env.SCHEDULER_MAX_CONCURRENT_RUNS,
      'SCHEDULER_MAX_CONCURRENT_RUNS',
      DEFAULTS.SCHEDULER_MAX_CONCURRENT_RUNS,
      BOUNDS.schedulerRuns.min,
      BOUNDS.schedulerRuns.max,
    ),
  };
}
