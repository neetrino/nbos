import { afterEach, describe, expect, it } from 'vitest';
import {
  BULLMQ_DEFAULT_DRAIN_DELAY_SEC,
  BULLMQ_DEFAULT_STALLED_INTERVAL_MS,
  resolveBullmqWorkerRuntimeOptions,
} from './bullmq-worker-runtime';

describe('resolveBullmqWorkerRuntimeOptions', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('uses Upstash-friendly defaults when unset', () => {
    delete process.env.BULLMQ_DRAIN_DELAY_SEC;
    delete process.env.BULLMQ_STALLED_INTERVAL_MS;
    expect(resolveBullmqWorkerRuntimeOptions()).toEqual({
      drainDelay: BULLMQ_DEFAULT_DRAIN_DELAY_SEC,
      stalledInterval: BULLMQ_DEFAULT_STALLED_INTERVAL_MS,
    });
  });

  it('accepts valid overrides', () => {
    process.env.BULLMQ_DRAIN_DELAY_SEC = '30';
    process.env.BULLMQ_STALLED_INTERVAL_MS = '180000';
    expect(resolveBullmqWorkerRuntimeOptions()).toEqual({
      drainDelay: 30,
      stalledInterval: 180_000,
    });
  });

  it('rejects out-of-range drain delay', () => {
    process.env.BULLMQ_DRAIN_DELAY_SEC = '4';
    expect(() => resolveBullmqWorkerRuntimeOptions()).toThrow(/BULLMQ_DRAIN_DELAY_SEC/);
    process.env.BULLMQ_DRAIN_DELAY_SEC = '61';
    expect(() => resolveBullmqWorkerRuntimeOptions()).toThrow(/BULLMQ_DRAIN_DELAY_SEC/);
  });

  it('rejects out-of-range stalled interval', () => {
    delete process.env.BULLMQ_DRAIN_DELAY_SEC;
    process.env.BULLMQ_STALLED_INTERVAL_MS = '1000';
    expect(() => resolveBullmqWorkerRuntimeOptions()).toThrow(/BULLMQ_STALLED_INTERVAL_MS/);
  });
});
