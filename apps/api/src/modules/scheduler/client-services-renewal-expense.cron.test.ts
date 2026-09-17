import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ClientServicesRenewalExpenseCron } from './client-services-renewal-expense.cron';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

function createConfig(getMap: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => getMap[key]),
  } as unknown as ConfigService;
}

describe('ClientServicesRenewalExpenseCron', () => {
  const original = { ...process.env };
  let schedulerService: { runClientServicesRenewalExpense: ReturnType<typeof vi.fn> };
  let registry: SchedulerRegistry;
  let jobRegistry: ScheduledJobRegistry;

  beforeEach(() => {
    process.env = { ...original, NODE_ENV: 'development', PROCESS_ROLE: 'all' };
    delete process.env.SCHEDULER_CLIENT_SERVICES_RENEWAL_EXPENSE_ENABLED;
    schedulerService = {
      runClientServicesRenewalExpense: vi.fn().mockResolvedValue({ status: 'SUCCEEDED' }),
    };
    registry = new SchedulerRegistry();
    jobRegistry = new ScheduledJobRegistry();
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('registers even when env flag is off (policy gates ticks)', async () => {
    const config = createConfig({});
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new ClientServicesRenewalExpenseCron(
      config,
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).toHaveBeenCalledWith(
      SCHEDULER_JOB_NAMES.clientServicesRenewalExpense,
      expect.any(Object),
    );
  });

  it('does not register for PROCESS_ROLE=api', async () => {
    process.env.PROCESS_ROLE = 'api';
    const config = createConfig({
      SCHEDULER_CLIENT_SERVICES_RENEWAL_EXPENSE_ENABLED: 'true',
    });
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new ClientServicesRenewalExpenseCron(
      config,
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).not.toHaveBeenCalled();
  });
});
