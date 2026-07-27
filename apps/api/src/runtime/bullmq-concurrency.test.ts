import { afterEach, describe, expect, it } from 'vitest';
import { resolveBullmqConcurrency } from './bullmq-concurrency';

describe('bullmq-concurrency', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('uses defaults when unset', () => {
    delete process.env.BULLMQ_MAIL_CONCURRENCY;
    expect(resolveBullmqConcurrency('mail')).toBe(5);
    expect(resolveBullmqConcurrency('whatsapp')).toBe(3);
    expect(resolveBullmqConcurrency('reports')).toBe(1);
    expect(resolveBullmqConcurrency('driveZip')).toBe(1);
  });

  it('rejects NaN and out-of-range (no silent unlimited)', () => {
    process.env.BULLMQ_MAIL_CONCURRENCY = 'NaN';
    expect(() => resolveBullmqConcurrency('mail')).toThrow(/Invalid BULLMQ_MAIL_CONCURRENCY/);
    process.env.BULLMQ_MAIL_CONCURRENCY = '0';
    expect(() => resolveBullmqConcurrency('mail')).toThrow(/Invalid/);
    process.env.BULLMQ_MAIL_CONCURRENCY = '99';
    expect(() => resolveBullmqConcurrency('mail')).toThrow(/Invalid/);
  });

  it('accepts valid override', () => {
    process.env.BULLMQ_REPORTS_CONCURRENCY = '2';
    expect(resolveBullmqConcurrency('reports')).toBe(2);
  });
});
