import { ScheduleModule } from '@nestjs/schedule';
import { describe, expect, it } from 'vitest';
import { ExpensePlanAutoDueCron } from './expense-plan-auto-due.cron';
import { PlatformSchedulerJobsController } from './platform-scheduler-jobs.controller';
import { PlatformSchedulerJobsService } from './platform-scheduler-jobs.service';
import { SchedulerJobRuntimeSnapshotService } from './scheduler-job-runtime-snapshot.service';
import { SchedulerModule } from './scheduler.module';

describe('SchedulerModule.forRoot', () => {
  it('includes cron providers when includeCrons is true', () => {
    const module = SchedulerModule.forRoot({ includeCrons: true });

    expect(module.imports).toContainEqual(ScheduleModule.forRoot());
    expect(module.providers).toContain(ExpensePlanAutoDueCron);
    expect(module.providers).toContain(SchedulerJobRuntimeSnapshotService);
  });

  it('omits cron providers when includeCrons is false', () => {
    const module = SchedulerModule.forRoot({ includeCrons: false });

    expect(module.imports).not.toContainEqual(ScheduleModule.forRoot());
    expect(module.providers).not.toContain(ExpensePlanAutoDueCron);
    expect(module.providers).not.toContain(SchedulerJobRuntimeSnapshotService);
  });

  it('registers Settings catalog API on both roles', () => {
    const withCrons = SchedulerModule.forRoot({ includeCrons: true });
    const withoutCrons = SchedulerModule.forRoot({ includeCrons: false });

    expect(withCrons.controllers).toContain(PlatformSchedulerJobsController);
    expect(withoutCrons.controllers).toContain(PlatformSchedulerJobsController);
    expect(withCrons.providers).toContain(PlatformSchedulerJobsService);
    expect(withoutCrons.providers).toContain(PlatformSchedulerJobsService);
  });
});
