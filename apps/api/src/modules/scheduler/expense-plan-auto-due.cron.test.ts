import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ExpensePlanAutoDueCron } from './expense-plan-auto-due.cron';
import { SchedulerService } from './scheduler.service';
import { EXPENSE_PLAN_AUTO_DUE_JOB_NAME } from './expense-plan-auto-due-cron.constants';

function createConfig(getMap: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => getMap[key]),
  } as unknown as ConfigService;
}

describe('ExpensePlanAutoDueCron', () => {
  let schedulerService: { runExpensePlanAutoDue: ReturnType<typeof vi.fn> };
  let registry: SchedulerRegistry;

  beforeEach(() => {
    schedulerService = { runExpensePlanAutoDue: vi.fn().mockResolvedValue({ eligibleCount: 0 }) };
    registry = new SchedulerRegistry();
  });

  it('does not register when disabled', () => {
    const config = createConfig({});
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new ExpensePlanAutoDueCron(
      config,
      registry,
      schedulerService as unknown as SchedulerService,
    );
    cron.onModuleInit();
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('registers cron when enabled', () => {
    const config = createConfig({
      SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED: 'true',
      SCHEDULER_EXPENSE_PLAN_AUTO_DUE_CRON: '0 3 * * *',
    });
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new ExpensePlanAutoDueCron(
      config,
      registry,
      schedulerService as unknown as SchedulerService,
    );
    cron.onModuleInit();
    expect(addSpy).toHaveBeenCalledWith(EXPENSE_PLAN_AUTO_DUE_JOB_NAME, expect.any(Object));
    cron.onModuleDestroy();
    expect(registry.doesExist('cron', EXPENSE_PLAN_AUTO_DUE_JOB_NAME)).toBe(false);
  });

  it('does not register when cron expression is invalid', () => {
    const config = createConfig({
      SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED: 'true',
      SCHEDULER_EXPENSE_PLAN_AUTO_DUE_CRON: 'not-a-valid-cron',
    });
    const addSpy = vi.spyOn(registry, 'addCronJob');
    const cron = new ExpensePlanAutoDueCron(
      config,
      registry,
      schedulerService as unknown as SchedulerService,
    );
    cron.onModuleInit();
    expect(addSpy).not.toHaveBeenCalled();
  });
});
