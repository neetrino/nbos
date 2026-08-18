import { describe, it, expect, afterEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { startSchedulerCronJob } from './scheduler-cron-bind';
import { ScheduledJobRegistry } from './scheduled-job-registry';

describe('startSchedulerCronJob', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('skips invalid cron expressions', () => {
    process.env = { ...original, NODE_ENV: 'development', PROCESS_ROLE: 'all' };
    process.env.SCHEDULER_TEST_JOB_ENABLED = 'true';
    const registry = new SchedulerRegistry();
    const addSpy = vi.spyOn(registry, 'addCronJob');
    startSchedulerCronJob({
      jobName: 'test-job',
      enabledEnvKey: 'SCHEDULER_TEST_JOB_ENABLED',
      cronEnvKey: 'SCHEDULER_TEST_JOB_CRON',
      defaultExpression: 'not-a-valid-cron',
      config: { get: () => 'not-a-valid-cron' } as unknown as ConfigService,
      schedulerRegistry: registry,
      jobRegistry: new ScheduledJobRegistry(),
      logger: new Logger('test'),
      run: async () => undefined,
    });
    expect(addSpy).not.toHaveBeenCalled();
  });
});
