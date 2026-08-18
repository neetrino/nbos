import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  MAIL_GMAIL_WATCH_RENEW_CRON_ENV,
  MAIL_GMAIL_WATCH_RENEW_DEFAULT_CRON,
  MAIL_GMAIL_WATCH_RENEW_ENABLED_ENV,
} from '../mail/mail-sync-runtime.constants';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class MailGmailWatchRenewCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailGmailWatchRenewCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.mailGmailWatchRenew;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: MAIL_GMAIL_WATCH_RENEW_ENABLED_ENV,
      cronEnvKey: MAIL_GMAIL_WATCH_RENEW_CRON_ENV,
      defaultExpression: MAIL_GMAIL_WATCH_RENEW_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runMailGmailWatchRenew('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
