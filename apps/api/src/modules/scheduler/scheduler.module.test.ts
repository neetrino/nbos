import { ScheduleModule } from '@nestjs/schedule';
import { describe, expect, it } from 'vitest';
import { ExpensePlanAutoDueCron } from './expense-plan-auto-due.cron';
import { SchedulerModule } from './scheduler.module';

describe('SchedulerModule.forRoot', () => {
  it('includes cron providers when includeCrons is true', () => {
    const module = SchedulerModule.forRoot({ includeCrons: true });

    expect(module.imports).toContainEqual(ScheduleModule.forRoot());
    expect(module.providers).toContain(ExpensePlanAutoDueCron);
  });

  it('omits cron providers when includeCrons is false', () => {
    const module = SchedulerModule.forRoot({ includeCrons: false });

    expect(module.imports).not.toContainEqual(ScheduleModule.forRoot());
    expect(module.providers).not.toContain(ExpensePlanAutoDueCron);
  });
});
