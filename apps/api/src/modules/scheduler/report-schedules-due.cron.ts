import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SchedulerService } from './scheduler.service';
import {
  REPORT_SCHEDULES_DUE_CRON_ENV,
  REPORT_SCHEDULES_DUE_DEFAULT_CRON,
  REPORT_SCHEDULES_DUE_ENABLED_ENV,
  REPORT_SCHEDULES_DUE_JOB_NAME,
} from './report-schedules-due-cron.constants';

function isCronEnabled(config: ConfigService): boolean {
  const raw = config.get<string>(REPORT_SCHEDULES_DUE_ENABLED_ENV)?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function resolveCronExpression(config: ConfigService): string {
  const fromEnv = config.get<string>(REPORT_SCHEDULES_DUE_CRON_ENV)?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : REPORT_SCHEDULES_DUE_DEFAULT_CRON;
}

@Injectable()
export class ReportSchedulesDueCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportSchedulesDueCron.name);

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
  ) {}

  onModuleInit(): void {
    if (!isCronEnabled(this.config)) {
      this.logger.log(
        `Report schedules due cron is off (set ${REPORT_SCHEDULES_DUE_ENABLED_ENV}=true to enable).`,
      );
      return;
    }
    if (this.schedulerRegistry.doesExist('cron', REPORT_SCHEDULES_DUE_JOB_NAME)) return;

    const expression = resolveCronExpression(this.config);
    let job: CronJob;
    try {
      job = new CronJob(expression, () => {
        void this.runSafely();
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Invalid ${REPORT_SCHEDULES_DUE_CRON_ENV}="${expression}": ${message}.`);
      return;
    }

    this.schedulerRegistry.addCronJob(REPORT_SCHEDULES_DUE_JOB_NAME, job);
    job.start();
    this.logger.log(`Registered cron "${REPORT_SCHEDULES_DUE_JOB_NAME}" (${expression}).`);
  }

  onModuleDestroy(): void {
    if (this.schedulerRegistry.doesExist('cron', REPORT_SCHEDULES_DUE_JOB_NAME)) {
      this.schedulerRegistry.deleteCronJob(REPORT_SCHEDULES_DUE_JOB_NAME);
    }
  }

  private async runSafely(): Promise<void> {
    try {
      await this.schedulerService.runReportSchedulesDue();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Report schedules due cron tick failed: ${message}`);
    }
  }
}
