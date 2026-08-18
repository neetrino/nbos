import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  MAIL_SYNC_RECONCILE_CRON_ENV,
  MAIL_SYNC_RECONCILE_DEFAULT_CRON,
  MAIL_SYNC_RECONCILE_ENABLED_ENV,
} from '../mail/mail-sync-runtime.constants';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class MailSyncReconcileCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailSyncReconcileCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.mailSyncReconcile;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: MAIL_SYNC_RECONCILE_ENABLED_ENV,
      cronEnvKey: MAIL_SYNC_RECONCILE_CRON_ENV,
      defaultExpression: MAIL_SYNC_RECONCILE_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runMailSyncReconcile('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
