import { describe, expect, it } from 'vitest';
import { type INestApplication, Logger } from '@nestjs/common';
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
});
