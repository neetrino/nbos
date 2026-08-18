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
    vi.restoreAllMocks();
  });

  it('skips invalid cron expressions', () => {
    process.env = { ...original, NODE_ENV: 'development', PROCESS_ROLE: 'all' };
    process.env.SCHEDULER_TEST_JOB_ENABLED = 'true';
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
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
    expect(stderrSpy.mock.calls.map(([chunk]) => String(chunk)).join('')).toContain(
      '[SchedulerCron] Invalid cron for test-job',
    );
  });

  it('registers paused when scheduler master is off', () => {
    process.env = {
      ...original,
      NODE_ENV: 'development',
      PROCESS_ROLE: 'scheduler',
      SCHEDULER_ENABLED: 'false',
      SCHEDULER_TEST_JOB_ENABLED: 'true',
    };
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const registry = new SchedulerRegistry();
    const jobRegistry = new ScheduledJobRegistry();
    startSchedulerCronJob({
      jobName: 'test-job',
      enabledEnvKey: 'SCHEDULER_TEST_JOB_ENABLED',
      cronEnvKey: 'SCHEDULER_TEST_JOB_CRON',
      defaultExpression: '0 3 * * *',
      config: { get: () => undefined } as unknown as ConfigService,
      schedulerRegistry: registry,
      jobRegistry,
      logger: new Logger('test'),
      run: async () => undefined,
    });
    expect(registry.doesExist('cron', 'test-job')).toBe(true);
    expect(jobRegistry.list()).toContain('test-job');
    const cronJob = registry.getCronJob('test-job');
    expect(cronJob.isActive).toBe(false);
    expect(stderrSpy.mock.calls.map(([chunk]) => String(chunk)).join('')).toContain(
      '[SchedulerCron] Registered cron test-job (paused)',
    );
  });

  it('uses default expression when config value is not a non-empty string', () => {
    process.env = { ...original, NODE_ENV: 'development', PROCESS_ROLE: 'all' };
    process.env.SCHEDULER_TEST_JOB_ENABLED = 'true';
    const registry = new SchedulerRegistry();
    startSchedulerCronJob({
      jobName: 'test-job',
      enabledEnvKey: 'SCHEDULER_TEST_JOB_ENABLED',
      cronEnvKey: 'SCHEDULER_TEST_JOB_CRON',
      defaultExpression: '0 3 * * *',
      config: { get: () => true } as unknown as ConfigService,
      schedulerRegistry: registry,
      jobRegistry: new ScheduledJobRegistry(),
      logger: new Logger('test'),
      run: async () => undefined,
    });
    expect(registry.doesExist('cron', 'test-job')).toBe(true);
  });

  it('registers in jobRegistry when cron already exists', () => {
    process.env = { ...original, NODE_ENV: 'development', PROCESS_ROLE: 'all' };
    process.env.SCHEDULER_TEST_JOB_ENABLED = 'true';
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const registry = new SchedulerRegistry();
    const jobRegistry = new ScheduledJobRegistry();
    const args = {
      jobName: 'test-job',
      enabledEnvKey: 'SCHEDULER_TEST_JOB_ENABLED',
      cronEnvKey: 'SCHEDULER_TEST_JOB_CRON',
      defaultExpression: '0 3 * * *',
      config: { get: () => undefined } as unknown as ConfigService,
      schedulerRegistry: registry,
      jobRegistry,
      logger: new Logger('test'),
      run: async () => undefined,
    };
    startSchedulerCronJob(args);
    startSchedulerCronJob(args);
    expect(jobRegistry.list()).toContain('test-job');
    expect(stderrSpy.mock.calls.map(([chunk]) => String(chunk)).join('')).toContain(
      '[SchedulerCron] Cron test-job already exists',
    );
  });
});
