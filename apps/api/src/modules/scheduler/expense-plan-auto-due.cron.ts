import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { shouldStartCronJob } from './scheduler-cron-gate';
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
    if (!shouldStartCronJob(EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV)) {
      this.logger.log(`Cron ${this.jobName} not registered (role/flags).`);
      return;
    }
    if (this.schedulerRegistry.doesExist('cron', this.jobName)) return;

    const expression =
      this.config.get<string>(EXPENSE_PLAN_AUTO_DUE_CRON_ENV)?.trim() ||
      EXPENSE_PLAN_AUTO_DUE_DEFAULT_CRON;
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
      await this.schedulerService.runExpensePlanAutoDue('cron');
    } catch (caught) {
      this.logger.error(`Expense plan auto-due cron failed`, caught);
    }
  }
}
