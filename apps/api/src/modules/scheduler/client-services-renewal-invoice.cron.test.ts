import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ClientServicesRenewalInvoiceCron } from './client-services-renewal-invoice.cron';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

function createConfig(getMap: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => getMap[key]),
  } as unknown as ConfigService;
}

describe('ClientServicesRenewalInvoiceCron', () => {
  const original = { ...process.env };
  let schedulerService: { runClientServicesRenewalInvoice: ReturnType<typeof vi.fn> };
  let registry: SchedulerRegistry;
  let jobRegistry: ScheduledJobRegistry;

  beforeEach(() => {
    process.env = { ...original, NODE_ENV: 'development', PROCESS_ROLE: 'all' };
    schedulerService = {
      runClientServicesRenewalInvoice: vi.fn().mockResolvedValue({ status: 'SUCCEEDED' }),
    };
    registry = new SchedulerRegistry();
    jobRegistry = new ScheduledJobRegistry();
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('does not register when disabled', () => {
    const config = createConfig({});
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new ClientServicesRenewalInvoiceCron(
      config,
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('registers cron when enabled', () => {
    process.env.SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED = 'true';
    const config = createConfig({
      SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED: 'true',
      SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_CRON: '0 6 * * *',
    });
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new ClientServicesRenewalInvoiceCron(
      config,
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).toHaveBeenCalledWith(
      SCHEDULER_JOB_NAMES.clientServicesRenewalInvoice,
      expect.any(Object),
    );
    expect(jobRegistry.list()).toContain(SCHEDULER_JOB_NAMES.clientServicesRenewalInvoice);
    cron.onModuleDestroy();
    expect(registry.doesExist('cron', SCHEDULER_JOB_NAMES.clientServicesRenewalInvoice)).toBe(
      false,
    );
  });

  it('does not register for PROCESS_ROLE=api', () => {
    process.env.PROCESS_ROLE = 'api';
    const config = createConfig({
      SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED: 'true',
    });
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new ClientServicesRenewalInvoiceCron(
      config,
      registry,
      schedulerService as unknown as SchedulerService,
      jobRegistry,
    );
    cron.onModuleInit();
    expect(addSpy).not.toHaveBeenCalled();
  });
});
