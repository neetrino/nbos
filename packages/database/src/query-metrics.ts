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

/** Keyword check — fixed literal alternatives, no nested quantifiers. */
const SENSITIVE_KEYWORD_RE = /password|passwd|secret|token|bearer/i;

/**
 * Serialized metric payloads above this size are treated as suspicious and redacted.
 * Avoids scanning/returning arbitrarily large objects that may hide secrets in the tail.
 */
export const METRIC_PAYLOAD_MAX_JSON_CHARS = 16_384;

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

/**
 * Replace SQL single-quoted string literals with `?` using a linear scan.
 * Handles doubled quotes (`''`) inside literals; leaves unterminated tails as `?`.
 */
export function replaceSqlStringLiterals(sql: string): string {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch !== "'") {
      out += ch;
      i += 1;
      continue;
    }
    // Opening quote — consume until closing quote ('' escapes a literal quote).
    i += 1;
    while (i < sql.length) {
      if (sql[i] === "'" && sql[i + 1] === "'") {
        i += 2;
        continue;
      }
      if (sql[i] === "'") {
        i += 1;
        break;
      }
      i += 1;
    }
    out += '?';
  }
  return out;
}

/** Strip literals / quoted strings for fingerprinting — never log raw SQL with values. */
export function fingerprintSql(sql: string): string {
  const normalized = replaceSqlStringLiterals(sql)
    .replace(/\$\d+/g, '?')
    .replace(/\b\d+(\.\d+)?\b/g, '?')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function startsWithIgnoreCase(text: string, index: number, prefixLower: string): boolean {
  if (index + prefixLower.length > text.length) return false;
  for (let i = 0; i < prefixLower.length; i += 1) {
    if (text[index + i]!.toLowerCase() !== prefixLower[i]) return false;
  }
  return true;
}

function schemeLengthAt(text: string, index: number): number {
  // Longer scheme first so `postgresql://` wins over `postgres://`.
  if (startsWithIgnoreCase(text, index, 'postgresql://')) return 'postgresql://'.length;
  if (startsWithIgnoreCase(text, index, 'postgres://')) return 'postgres://'.length;
  return 0;
}

function isAuthorityEnd(ch: string): boolean {
  return (
    ch === '/' ||
    ch === '?' ||
    ch === '#' ||
    ch === ' ' ||
    ch === '\t' ||
    ch === '\n' ||
    ch === '\r'
  );
}

/**
 * Linear O(n) scan for `postgres(ql)://user:password@...` credentials in text.
 * Does not treat `postgresql://host/db` or `postgresql://user@host/db` as credentials.
 */
export function textContainsPostgresUrlCredentials(text: string): boolean {
  let i = 0;
  while (i < text.length) {
    const schemeLen = schemeLengthAt(text, i);
    if (schemeLen === 0) {
      i += 1;
      continue;
    }

    const authorityStart = i + schemeLen;
    let atPos = -1;
    let j = authorityStart;
    while (j < text.length && !isAuthorityEnd(text[j]!)) {
      if (text[j] === '@' && atPos < 0) {
        atPos = j;
      }
      j += 1;
    }

    if (atPos >= 0) {
      const userInfo = text.slice(authorityStart, atPos);
      if (userInfo.includes(':')) {
        return true;
      }
    }

    // Advance past this authority (or scheme) — never re-scan earlier bytes.
    i = Math.max(authorityStart, j);
  }
  return false;
}

function buildRedactedMetricPayload(payload: Record<string, unknown>): Record<string, unknown> {
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

/** Ensure log payloads never contain password-like substrings from accidental URL leaks. */
export function sanitizeMetricPayload(payload: Record<string, unknown>): Record<string, unknown> {
  let json: string;
  try {
    json = JSON.stringify(payload);
  } catch {
    return buildRedactedMetricPayload(payload);
  }

  if (json === undefined) {
    return buildRedactedMetricPayload(payload);
  }

  if (json.length > METRIC_PAYLOAD_MAX_JSON_CHARS) {
    return buildRedactedMetricPayload(payload);
  }

  if (SENSITIVE_KEYWORD_RE.test(json) || textContainsPostgresUrlCredentials(json)) {
    return buildRedactedMetricPayload(payload);
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
