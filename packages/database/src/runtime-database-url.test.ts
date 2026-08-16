import { describe, expect, it } from 'vitest';
import { buildRuntimeDatabaseUrl } from './runtime-database-url';
import { resolvePoolMaxForRole, resolveDbPoolRuntimeConfig } from './db-pool-env';
import { assertConnectionBudgetForStartup, calculateConnectionBudget } from './connection-budget';
import {
  fingerprintSql,
  sanitizeMetricPayload,
  shouldSampleQuery,
  resetDbQueryCounters,
  recordDbQuery,
  getDbQueryCounters,
} from './query-metrics';
import { classifyDatabaseError } from './db-errors';

describe('buildRuntimeDatabaseUrl', () => {
  it('preserves sslmode and does not drop host', () => {
    const { url, safeSummary } = buildRuntimeDatabaseUrl({
      role: 'api',
      baseUrl: 'postgresql://u:p@ep-xxx-pooler.neon.tech/neondb?sslmode=require&foo=1',
      poolMax: 5,
      poolTimeoutSec: 10,
      connectTimeoutSec: 10,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('sslmode')).toBe('require');
    expect(parsed.searchParams.get('foo')).toBe('1');
    expect(parsed.searchParams.get('connection_limit')).toBe('5');
    expect(parsed.searchParams.get('application_name')).toBe('nbos-api');
    expect(parsed.searchParams.get('options')).toBeNull();
    expect(safeSummary).not.toContain('p@');
    expect(safeSummary).not.toContain(':p');
  });

  it('strips statement_timeout from options for Neon pooler compatibility', () => {
    const { url } = buildRuntimeDatabaseUrl({
      role: 'api',
      baseUrl:
        'postgresql://u:p@ep-xxx-pooler.neon.tech/neondb?sslmode=require&options=-c%20statement_timeout%3D30000',
      poolMax: 5,
      poolTimeoutSec: 10,
      connectTimeoutSec: 10,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('options')).toBeNull();
    expect(url).not.toMatch(/statement_timeout/i);
  });

  it('does not duplicate connection_limit', () => {
    const { url } = buildRuntimeDatabaseUrl({
      role: 'worker',
      baseUrl: 'postgresql://u:p@host/db?connection_limit=99&sslmode=require',
      poolMax: 4,
      poolTimeoutSec: 10,
      connectTimeoutSec: 10,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.getAll('connection_limit')).toEqual(['4']);
  });

  it('rejects invalid URL', () => {
    expect(() =>
      buildRuntimeDatabaseUrl({
        role: 'api',
        baseUrl: 'not-a-url',
        poolMax: 5,
        poolTimeoutSec: 10,
        connectTimeoutSec: 10,
      }),
    ).toThrow(/Invalid DATABASE_URL/);
  });
});

describe('pool env', () => {
  it('resolves role-specific pool max', () => {
    const env = {
      DB_POOL_MAX_API: '5',
      DB_POOL_MAX_WORKER: '4',
      DB_POOL_MAX_SCHEDULER: '2',
    };
    expect(resolvePoolMaxForRole('api', env)).toBe(5);
    expect(resolvePoolMaxForRole('worker', env)).toBe(4);
    expect(resolvePoolMaxForRole('scheduler', env)).toBe(2);
  });

  it('rejects invalid pool max', () => {
    expect(() => resolvePoolMaxForRole('api', { DB_POOL_MAX_API: 'NaN' })).toThrow();
    expect(() => resolvePoolMaxForRole('api', { DB_POOL_MAX_API: '0' })).toThrow();
  });
});

describe('connection budget', () => {
  it('calculates planned connections', () => {
    const env = {
      DB_POOL_MAX_API: '5',
      DB_POOL_MAX_WORKER: '4',
      DB_POOL_MAX_SCHEDULER: '2',
      API_REPLICA_COUNT: '2',
      WORKER_REPLICA_COUNT: '1',
      SCHEDULER_REPLICA_COUNT: '1',
      DB_RESERVED_CONNECTIONS: '4',
      DB_TOTAL_CONNECTION_BUDGET: '30',
    };
    const b = calculateConnectionBudget(env);
    expect(b.api.total).toBe(10);
    expect(b.worker.total).toBe(4);
    expect(b.scheduler.total).toBe(2);
    expect(b.plannedTotal).toBe(20);
    expect(b.status).toBe('OK');
  });

  it('detects over budget', () => {
    const env = {
      DB_POOL_MAX_API: '20',
      API_REPLICA_COUNT: '3',
      DB_TOTAL_CONNECTION_BUDGET: '10',
      DB_RESERVED_CONNECTIONS: '0',
      WORKER_REPLICA_COUNT: '1',
      SCHEDULER_REPLICA_COUNT: '1',
      DB_POOL_MAX_WORKER: '1',
      DB_POOL_MAX_SCHEDULER: '1',
    };
    expect(() => assertConnectionBudgetForStartup(env)).toThrow(/exceeded/);
  });

  it('requires budget in production', () => {
    expect(() =>
      assertConnectionBudgetForStartup({
        NODE_ENV: 'production',
        DB_POOL_MAX_API: '5',
        DB_POOL_MAX_WORKER: '4',
        DB_POOL_MAX_SCHEDULER: '2',
      }),
    ).toThrow(/DB_TOTAL_CONNECTION_BUDGET/);
  });
});

describe('query metrics', () => {
  it('samples by rate', () => {
    expect(shouldSampleQuery(0, () => 0)).toBe(false);
    expect(shouldSampleQuery(1, () => 0.99)).toBe(true);
    expect(shouldSampleQuery(0.01, () => 0.5)).toBe(false);
    expect(shouldSampleQuery(0.01, () => 0.001)).toBe(true);
  });

  it('fingerprints without literals', () => {
    const a = fingerprintSql(`SELECT * FROM t WHERE id = 'secret@mail.com' AND n = 42`);
    const b = fingerprintSql(`SELECT * FROM t WHERE id = 'other' AND n = 99`);
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  it('sanitizes password-like payloads', () => {
    const cleaned = sanitizeMetricPayload({
      event: 'db.slow_query',
      role: 'api',
      model: 'X',
      operation: 'findMany',
      durationMs: 10,
      status: 'ok',
      sampled: true,
      leak: 'postgresql://user:password@host/db',
    });
    expect(cleaned.redacted).toBe(true);
    expect(JSON.stringify(cleaned)).not.toContain('password');
  });

  it('records slow queries', () => {
    resetDbQueryCounters();
    recordDbQuery({
      role: 'api',
      model: 'Notification',
      operation: 'findMany',
      durationMs: 800,
      status: 'ok',
      slowThresholdMs: 500,
      sampleRate: 0,
      metricsEnabled: false,
    });
    expect(getDbQueryCounters().db_slow_queries_total).toBe(1);
  });
});

describe('classifyDatabaseError', () => {
  it('maps pool timeout', () => {
    const c = classifyDatabaseError({
      code: 'P2024',
      message: 'Timed out fetching a new connection',
    });
    expect(c?.code).toBe('DB_POOL_TIMEOUT');
    expect(c?.httpStatus).toBe(503);
  });
});

describe('resolveDbPoolRuntimeConfig', () => {
  it('parses sample rate', () => {
    const cfg = resolveDbPoolRuntimeConfig({ DB_QUERY_SAMPLE_RATE: '0.05' });
    expect(cfg.querySampleRate).toBe(0.05);
  });
});
