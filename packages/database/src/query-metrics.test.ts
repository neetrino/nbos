import { describe, expect, it } from 'vitest';
import {
  fingerprintSql,
  METRIC_PAYLOAD_MAX_JSON_CHARS,
  replaceSqlStringLiterals,
  sanitizeMetricPayload,
  textContainsPostgresUrlCredentials,
} from './query-metrics';

const BASE_PAYLOAD = {
  event: 'db.query' as const,
  role: 'api',
  model: 'Employee',
  operation: 'findMany',
  durationMs: 12,
  status: 'ok' as const,
  sampled: true,
};

describe('textContainsPostgresUrlCredentials', () => {
  it('detects credential URLs for postgres and postgresql schemes', () => {
    expect(textContainsPostgresUrlCredentials('postgresql://user:password@localhost/db')).toBe(
      true,
    );
    expect(textContainsPostgresUrlCredentials('postgres://user:password@localhost/db')).toBe(true);
    expect(textContainsPostgresUrlCredentials('POSTGRESQL://user:password@localhost/db')).toBe(
      true,
    );
  });

  it('ignores URLs without password userinfo', () => {
    expect(textContainsPostgresUrlCredentials('postgresql://localhost/db')).toBe(false);
    expect(textContainsPostgresUrlCredentials('postgresql://user@localhost/db')).toBe(false);
    expect(textContainsPostgresUrlCredentials('postgresql://localhost:5432/db')).toBe(false);
  });

  it('handles multiple URLs, fragments, and nested text', () => {
    const text = 'ok postgresql://localhost/db and later postgresql://u:p@h/db#frag?x=1 then more';
    expect(textContainsPostgresUrlCredentials(text)).toBe(true);
  });

  it('does not hang on long strings without @', () => {
    const attack = `${'postgresql://9:'.repeat(20_000)}tail`;
    expect(textContainsPostgresUrlCredentials(attack)).toBe(false);
  });

  it('detects credentials near the end of a long string', () => {
    const text = `${'x'.repeat(50_000)}postgresql://user:secret@host/db`;
    expect(textContainsPostgresUrlCredentials(text)).toBe(true);
  });

  it('accepts percent-encoded userinfo with colon', () => {
    expect(textContainsPostgresUrlCredentials('postgresql://us%40er:p%3Ass@localhost/db')).toBe(
      true,
    );
  });
});

describe('sanitizeMetricPayload', () => {
  it('redacts keyword and credential payloads', () => {
    expect(sanitizeMetricPayload({ ...BASE_PAYLOAD, note: 'has password' }).redacted).toBe(true);
    expect(sanitizeMetricPayload({ ...BASE_PAYLOAD, note: 'bearer token' }).redacted).toBe(true);
    expect(
      sanitizeMetricPayload({
        ...BASE_PAYLOAD,
        leak: 'postgresql://user:password@localhost/db',
      }).redacted,
    ).toBe(true);
    expect(
      JSON.stringify(
        sanitizeMetricPayload({
          ...BASE_PAYLOAD,
          nested: { url: 'postgres://u:p@h/db' },
        }),
      ),
    ).not.toContain('postgres://');
  });

  it('keeps safe payloads', () => {
    const safe = { ...BASE_PAYLOAD, sqlFingerprint: 'abcd1234abcd1234' };
    expect(sanitizeMetricPayload(safe)).toEqual(safe);
  });

  it('redacts oversized payloads instead of returning them', () => {
    const oversized = {
      ...BASE_PAYLOAD,
      blob: 'a'.repeat(METRIC_PAYLOAD_MAX_JSON_CHARS),
    };
    const cleaned = sanitizeMetricPayload(oversized);
    expect(cleaned.redacted).toBe(true);
    expect(cleaned).not.toHaveProperty('blob');
  });

  it('redacts circular payloads that cannot be stringified', () => {
    const circular: Record<string, unknown> = { ...BASE_PAYLOAD };
    circular.self = circular;
    const cleaned = sanitizeMetricPayload(circular);
    expect(cleaned.redacted).toBe(true);
  });

  it('completes on pathological repeated scheme prefixes', () => {
    const leak = `${'postgresql://user:'.repeat(5_000)}no-at`;
    const cleaned = sanitizeMetricPayload({ ...BASE_PAYLOAD, leak });
    // No '@' ⇒ no credentials; may still redact if keyword "user" is absent — ensure finish.
    expect(cleaned).toBeDefined();
    expect(typeof cleaned.event).toBe('string');
  });
});

describe('fingerprintSql / replaceSqlStringLiterals', () => {
  it('normalizes string literals including escaped quotes', () => {
    expect(replaceSqlStringLiterals(`SELECT * FROM users WHERE email = 'test@example.com'`)).toBe(
      `SELECT * FROM users WHERE email = ?`,
    );
    expect(replaceSqlStringLiterals(`SELECT 'it''s valid'`)).toBe(`SELECT ?`);
    expect(replaceSqlStringLiterals(`INSERT INTO logs(value) VALUES ('a'), ('b')`)).toBe(
      `INSERT INTO logs(value) VALUES (?), (?)`,
    );
  });

  it('handles unterminated string literals', () => {
    expect(replaceSqlStringLiterals(`SELECT 'unterminated`)).toBe(`SELECT ?`);
  });

  it('produces stable fingerprints without literals', () => {
    const a = fingerprintSql(`SELECT * FROM t WHERE id = 'secret@mail.com' AND n = 42`);
    const b = fingerprintSql(`SELECT * FROM t WHERE id = 'other' AND n = 99`);
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  it('fingerprints long inputs with many quotes without hanging', () => {
    const sql = `SELECT ${"'x''y',".repeat(10_000)} 1`;
    const fp = fingerprintSql(sql);
    expect(fp).toHaveLength(16);
  });
});
