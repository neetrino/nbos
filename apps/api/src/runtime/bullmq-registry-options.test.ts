import { describe, expect, it } from 'vitest';
import { BullmqWorkerRegistry } from './bullmq-worker-registry';
import { BULLMQ_CRITICAL_JOB_OPTIONS, BULLMQ_EXPORT_JOB_OPTIONS } from './bullmq-job-options';

describe('bullmq-worker-registry', () => {
  it('api assertion fails when workers registered', () => {
    const registry = new BullmqWorkerRegistry();
    registry.register('mail');
    expect(() => registry.assertApiHasNoWorkers()).toThrow(/must not start/);
  });

  it('worker assertion requires expected queues', () => {
    const registry = new BullmqWorkerRegistry();
    registry.register('mail');
    expect(() => registry.assertWorkerHasConsumers(['mail', 'reports.export-jobs'])).toThrow(
      /missing BullMQ consumer/,
    );
  });

  it('readiness false during shutdown', () => {
    const registry = new BullmqWorkerRegistry();
    registry.register('mail');
    registry.markStartupComplete();
    expect(registry.isStartupComplete()).toBe(true);
    registry.beginShutdown();
    expect(registry.isShuttingDown()).toBe(true);
  });
});

describe('bullmq-job-options', () => {
  it('applies retention and retries for critical and export queues', () => {
    expect(BULLMQ_CRITICAL_JOB_OPTIONS.attempts).toBe(5);
    expect(BULLMQ_EXPORT_JOB_OPTIONS.attempts).toBe(3);
    expect(BULLMQ_CRITICAL_JOB_OPTIONS.removeOnComplete).toEqual({
      age: 86_400,
      count: 1000,
    });
    expect(BULLMQ_EXPORT_JOB_OPTIONS.removeOnFail).toEqual({
      age: 604_800,
      count: 1000,
    });
  });
});
