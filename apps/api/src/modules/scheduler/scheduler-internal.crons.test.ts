import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { BillingCron } from './scheduler-internal.crons';
import { BILLING_CRON_ENABLED_ENV, BILLING_CRON_ENV } from './scheduler-internal-cron.constants';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

function createConfig(getMap: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => getMap[key]),
  } as unknown as ConfigService;
}

describe('BillingCron', () => {
  const original = { ...process.env };
  let schedulerService: { runBilling: ReturnType<typeof vi.fn> };
  let registry: SchedulerRegistry;
  let jobRegistry: ScheduledJobRegistry;

  beforeEach(() => {
    process.env = { ...original, NODE_ENV: 'development', PROCESS_ROLE: 'all' };
    delete process.env[BILLING_CRON_ENABLED_ENV];
    schedulerService = { runBilling: vi.fn().mockResolvedValue({ status: 'SUCCEEDED' }) };
    registry = new SchedulerRegistry();
    jobRegistry = new ScheduledJobRegistry();
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('registers even when env flag is off (policy gates ticks)', async () => {
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new BillingCron(
      createConfig({}),
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).toHaveBeenCalledWith(SCHEDULER_JOB_NAMES.billing, expect.any(Object));
  });

  it('registers when enabled', async () => {
    process.env[BILLING_CRON_ENABLED_ENV] = 'true';
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new BillingCron(
      createConfig({ [BILLING_CRON_ENABLED_ENV]: 'true', [BILLING_CRON_ENV]: '0 2 1 * *' }),
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).toHaveBeenCalledWith(SCHEDULER_JOB_NAMES.billing, expect.any(Object));
    expect(jobRegistry.list()).toContain(SCHEDULER_JOB_NAMES.billing);
    cron.onModuleDestroy();
    expect(registry.doesExist('cron', SCHEDULER_JOB_NAMES.billing)).toBe(false);
  });

  it('does not register for PROCESS_ROLE=api', async () => {
    process.env.PROCESS_ROLE = 'api';
    process.env[BILLING_CRON_ENABLED_ENV] = 'true';
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new BillingCron(
      createConfig({ [BILLING_CRON_ENABLED_ENV]: 'true' }),
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).not.toHaveBeenCalled();
  });
});
