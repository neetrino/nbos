import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RecurringTasksDueCron } from './recurring-tasks-due.cron';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

function createConfig(getMap: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => getMap[key]),
  } as unknown as ConfigService;
}

describe('RecurringTasksDueCron', () => {
  const original = { ...process.env };
  let schedulerService: { runRecurringTasksDue: ReturnType<typeof vi.fn> };
  let registry: SchedulerRegistry;
  let jobRegistry: ScheduledJobRegistry;

  beforeEach(() => {
    process.env = { ...original, NODE_ENV: 'development', PROCESS_ROLE: 'all' };
    schedulerService = {
      runRecurringTasksDue: vi.fn().mockResolvedValue({ status: 'SUCCEEDED' }),
    };
    registry = new SchedulerRegistry();
    jobRegistry = new ScheduledJobRegistry();
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('does not register when disabled', () => {
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new RecurringTasksDueCron(
      createConfig({}),
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('registers cron when enabled', () => {
    process.env.SCHEDULER_RECURRING_TASKS_DUE_ENABLED = 'true';
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new RecurringTasksDueCron(
      createConfig({
        SCHEDULER_RECURRING_TASKS_DUE_ENABLED: 'true',
        SCHEDULER_RECURRING_TASKS_DUE_CRON: '*/5 * * * *',
      }),
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).toHaveBeenCalledWith(SCHEDULER_JOB_NAMES.recurringTasksDue, expect.any(Object));
    expect(jobRegistry.list()).toContain(SCHEDULER_JOB_NAMES.recurringTasksDue);
    cron.onModuleDestroy();
  });
});
