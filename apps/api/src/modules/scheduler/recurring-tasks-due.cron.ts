import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
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
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: RECURRING_TASKS_DUE_ENABLED_ENV,
      cronEnvKey: RECURRING_TASKS_DUE_CRON_ENV,
      defaultExpression: RECURRING_TASKS_DUE_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runRecurringTasksDue('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
