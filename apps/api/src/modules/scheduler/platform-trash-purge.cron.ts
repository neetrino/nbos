import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import {
  PLATFORM_TRASH_PURGE_CRON_ENV,
  PLATFORM_TRASH_PURGE_DEFAULT_CRON,
  PLATFORM_TRASH_PURGE_ENABLED_ENV,
} from '../platform-lifecycle/platform-trash-purge.constants';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { shouldStartCronJob } from './scheduler-cron-gate';
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
    if (!shouldStartCronJob(PLATFORM_TRASH_PURGE_ENABLED_ENV)) {
      this.logger.log(`Cron ${this.jobName} not registered (role/flags).`);
      return;
    }
    if (this.schedulerRegistry.doesExist('cron', this.jobName)) return;
    const expression =
      this.config.get<string>(PLATFORM_TRASH_PURGE_CRON_ENV)?.trim() ||
      PLATFORM_TRASH_PURGE_DEFAULT_CRON;
    let job: CronJob;
    try {
      job = new CronJob(expression, () => {
        void this.runSafely();
      });
    } catch (caught) {
      this.logger.error(`Invalid cron for ${this.jobName}`, caught);
      return;
    }
    this.schedulerRegistry.addCronJob(this.jobName, job);
    job.start();
    this.jobRegistry.register(this.jobName);
    this.logger.log(`Registered cron ${this.jobName} (${expression})`);
  }

  onModuleDestroy(): void {
    if (this.schedulerRegistry.doesExist('cron', this.jobName)) {
      this.schedulerRegistry.deleteCronJob(this.jobName);
    }
  }

  private async runSafely(): Promise<void> {
    if (this.jobRegistry.isShuttingDown()) return;
    try {
      await this.schedulerService.runPlatformTrashPurge('cron');
    } catch (caught) {
      this.logger.error(`Platform trash purge cron failed`, caught);
    }
  }
}
