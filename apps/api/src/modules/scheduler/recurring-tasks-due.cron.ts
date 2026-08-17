import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { shouldStartCronJob } from './scheduler-cron-gate';
import {
  RECURRING_TASKS_DUE_CRON_ENV,
  RECURRING_TASKS_DUE_DEFAULT_CRON,
  RECURRING_TASKS_DUE_ENABLED_ENV,
} from './recurring-tasks-due-cron.constants';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class RecurringTasksDueCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecurringTasksDueCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.recurringTasksDue;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    if (!shouldStartCronJob(RECURRING_TASKS_DUE_ENABLED_ENV)) {
      this.logger.log(`Cron ${this.jobName} not registered (role/flags).`);
      return;
    }
    if (this.schedulerRegistry.doesExist('cron', this.jobName)) return;
    const expression =
      this.config.get<string>(RECURRING_TASKS_DUE_CRON_ENV)?.trim() ||
      RECURRING_TASKS_DUE_DEFAULT_CRON;
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
      await this.schedulerService.runRecurringTasksDue('cron');
    } catch (caught) {
      this.logger.error(`Recurring tasks due cron failed`, caught);
    }
  }
}
