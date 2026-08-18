import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  PLATFORM_TRASH_PURGE_CRON_ENV,
  PLATFORM_TRASH_PURGE_DEFAULT_CRON,
  PLATFORM_TRASH_PURGE_ENABLED_ENV,
} from '../platform-lifecycle/platform-trash-purge.constants';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class PlatformTrashPurgeCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlatformTrashPurgeCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.platformTrashPurge;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: PLATFORM_TRASH_PURGE_ENABLED_ENV,
      cronEnvKey: PLATFORM_TRASH_PURGE_CRON_ENV,
      defaultExpression: PLATFORM_TRASH_PURGE_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runPlatformTrashPurge('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
