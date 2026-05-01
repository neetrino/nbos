import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SchedulerService } from './scheduler.service';
import {
  EXPENSE_PLAN_AUTO_DUE_CRON_ENV,
  EXPENSE_PLAN_AUTO_DUE_DEFAULT_CRON,
  EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV,
  EXPENSE_PLAN_AUTO_DUE_JOB_NAME,
} from './expense-plan-auto-due-cron.constants';

function isCronEnabled(config: ConfigService): boolean {
  const raw = config.get<string>(EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV)?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function resolveCronExpression(config: ConfigService): string {
  const fromEnv = config.get<string>(EXPENSE_PLAN_AUTO_DUE_CRON_ENV)?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : EXPENSE_PLAN_AUTO_DUE_DEFAULT_CRON;
}

/**
 * Optional in-process scheduler: runs the same path as `POST /scheduler/expense-plan-auto-due`.
 * Disabled unless {@link EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV} is truthy.
 */
@Injectable()
export class ExpensePlanAutoDueCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExpensePlanAutoDueCron.name);

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
  ) {}

  onModuleInit(): void {
    if (!isCronEnabled(this.config)) {
      this.logger.log(
        `Expense plan auto-due in-process cron is off (set ${EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV}=true to enable).`,
      );
      return;
    }

    if (this.schedulerRegistry.doesExist('cron', EXPENSE_PLAN_AUTO_DUE_JOB_NAME)) {
      this.logger.warn(
        `Cron "${EXPENSE_PLAN_AUTO_DUE_JOB_NAME}" already exists; skipping registration.`,
      );
      return;
    }

    const expression = resolveCronExpression(this.config);
    if (expression === EXPENSE_PLAN_AUTO_DUE_DEFAULT_CRON) {
      this.logger.warn(
        `Using default cron "${expression}" (${EXPENSE_PLAN_AUTO_DUE_CRON_ENV} unset). Set TZ=UTC in production if you intend UTC wall clock.`,
      );
    }

    let job: CronJob;
    try {
      job = new CronJob(expression, () => {
        void this.runSafely();
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(
        `Invalid ${EXPENSE_PLAN_AUTO_DUE_CRON_ENV}="${expression}": ${message}. In-process cron not started.`,
      );
      return;
    }

    this.schedulerRegistry.addCronJob(EXPENSE_PLAN_AUTO_DUE_JOB_NAME, job);
    job.start();
    this.logger.log(
      `Registered in-process cron "${EXPENSE_PLAN_AUTO_DUE_JOB_NAME}" (${expression}) → expense plan auto-due.`,
    );
  }

  onModuleDestroy(): void {
    if (!this.schedulerRegistry.doesExist('cron', EXPENSE_PLAN_AUTO_DUE_JOB_NAME)) {
      return;
    }
    this.schedulerRegistry.deleteCronJob(EXPENSE_PLAN_AUTO_DUE_JOB_NAME);
  }

  private async runSafely(): Promise<void> {
    try {
      await this.schedulerService.runExpensePlanAutoDue();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Expense plan auto-due cron tick failed: ${message}`);
    }
  }
}
