import { createHash } from 'node:crypto';

export type DbQueryMetricLabels = {
  processRole: string;
  operation: string;
  model: string;
  status: 'ok' | 'error';
};

export type DbQueryMetricEvent = {
  event: 'db.query' | 'db.slow_query';
  role: string;
  model: string;
  operation: string;
  durationMs: number;
  status: 'ok' | 'error';
  sampled: boolean;
  sqlFingerprint?: string;
};

type MetricCounters = {
  db_queries_total: number;
  db_query_errors_total: number;
  db_slow_queries_total: number;
  db_transactions_total: number;
  db_pool_wait_timeout_total: number;
};

const counters: MetricCounters = {
  db_queries_total: 0,
  db_query_errors_total: 0,
  db_slow_queries_total: 0,
  db_transactions_total: 0,
  db_pool_wait_timeout_total: 0,
};

let sink: ((line: string) => void) | null = null;

export function setDbQueryMetricSink(next: ((line: string) => void) | null): void {
  sink = next;
}

export function getDbQueryCounters(): Readonly<MetricCounters> {
  return { ...counters };
}

export function resetDbQueryCounters(): void {
  counters.db_queries_total = 0;
  counters.db_query_errors_total = 0;
  counters.db_slow_queries_total = 0;
  counters.db_transactions_total = 0;
  counters.db_pool_wait_timeout_total = 0;
}

/** Strip literals / quoted strings for fingerprinting — never log raw SQL with values. */
export function fingerprintSql(sql: string): string {
  const normalized = sql
    .replace(/'([^']|'')*'/g, '?')
    .replace(/\$\d+/g, '?')
    .replace(/\b\d+(\.\d+)?\b/g, '?')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/** Ensure log payloads never contain password-like substrings from accidental URL leaks. */
export function sanitizeMetricPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const json = JSON.stringify(payload);
  if (/password|passwd|secret|token|bearer|postgresql:\/\/[^:]+:[^@]+@/i.test(json)) {
    return {
      event: payload.event ?? 'db.query',
      role: payload.role,
      model: payload.model,
      operation: payload.operation,
      durationMs: payload.durationMs,
      status: payload.status,
      sampled: payload.sampled,
      redacted: true,
    };
  }
  return payload;
}

export function shouldSampleQuery(sampleRate: number, random = Math.random): boolean {
  if (sampleRate <= 0) return false;
  if (sampleRate >= 1) return true;
  return random() < sampleRate;
}

export function recordDbQuery(input: {
  role: string;
  model: string;
  operation: string;
  durationMs: number;
  status: 'ok' | 'error';
  slowThresholdMs: number;
  sampleRate: number;
  metricsEnabled: boolean;
  sqlFingerprint?: string;
  isTransaction?: boolean;
}): void {
  counters.db_queries_total += 1;
  if (input.status === 'error') counters.db_query_errors_total += 1;
  if (input.isTransaction) counters.db_transactions_total += 1;

  const isSlow = input.durationMs >= input.slowThresholdMs;
  if (isSlow) counters.db_slow_queries_total += 1;

  if (!input.metricsEnabled) return;

  const sampled = isSlow || shouldSampleQuery(input.sampleRate);
  if (!sampled) return;

  const payload = sanitizeMetricPayload({
    event: isSlow ? 'db.slow_query' : 'db.query',
    role: input.role,
    model: input.model,
    operation: input.operation,
    durationMs: input.durationMs,
    status: input.status,
    sampled: true,
    ...(input.sqlFingerprint ? { sqlFingerprint: input.sqlFingerprint } : {}),
  });

  const line = JSON.stringify(payload);
  if (sink) sink(line);
  else process.stdout.write(`${line}\n`);
}

export function recordDbPoolTimeout(): void {
  counters.db_pool_wait_timeout_total += 1;
}
