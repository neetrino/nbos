import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import {
  EXPENSE_PLAN_AUTO_DUE_CRON_ENV,
  EXPENSE_PLAN_AUTO_DUE_DEFAULT_CRON,
  EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV,
} from './expense-plan-auto-due-cron.constants';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class ExpensePlanAutoDueCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExpensePlanAutoDueCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.expensePlanAutoDue;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV,
      cronEnvKey: EXPENSE_PLAN_AUTO_DUE_CRON_ENV,
      defaultExpression: EXPENSE_PLAN_AUTO_DUE_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runExpensePlanAutoDue('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
