import { describe, expect, it, vi } from 'vitest';
import { type INestApplication, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { logSchedulerBootSnapshot } from './scheduler-boot-log';
import { ScheduledJobRegistry } from './scheduled-job-registry';

describe('logSchedulerBootSnapshot', () => {
  it('writes a snapshot without changing the job registry', () => {
    const registry = new ScheduledJobRegistry();
    const app = {
      get: (token: unknown) => {
        if (token === ScheduledJobRegistry) return registry;
        return undefined;
      },
    } as INestApplication;

    expect(() =>
      logSchedulerBootSnapshot(app, new Logger('test'), ['SCHEDULER_BILLING_ENABLED']),
    ).not.toThrow();
    expect(registry.list()).toEqual([]);
  });

  it('includes scheduleRegistry=yes when SchedulerRegistry is present', () => {
    const registry = new ScheduledJobRegistry();
    const nestRegistry = { getCronJobs: () => new Map<string, unknown>() };
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const app = {
      get: (token: unknown) => {
        if (token === ScheduledJobRegistry) return registry;
        if (token === SchedulerRegistry) return nestRegistry;
        return undefined;
      },
    } as INestApplication;

    logSchedulerBootSnapshot(app, new Logger('test'), []);

    const written = stderrSpy.mock.calls.map(([chunk]) => String(chunk)).join('');
    expect(written).toContain('scheduleRegistry=yes');
    stderrSpy.mockRestore();
  });

  it('includes scheduleRegistry=no when SchedulerRegistry is absent', () => {
    const registry = new ScheduledJobRegistry();
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const app = {
      get: (token: unknown) => {
        if (token === ScheduledJobRegistry) return registry;
        return undefined;
      },
    } as INestApplication;

    logSchedulerBootSnapshot(app, new Logger('test'), []);

    const written = stderrSpy.mock.calls.map(([chunk]) => String(chunk)).join('');
    expect(written).toContain('scheduleRegistry=no');
    stderrSpy.mockRestore();
  });
});
