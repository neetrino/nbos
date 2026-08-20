import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  NOTIFICATION_INBOX_RECONCILE_CRON_ENABLED_ENV,
  NOTIFICATION_INBOX_RECONCILE_CRON_ENV,
  NOTIFICATION_INBOX_RECONCILE_DEFAULT_CRON,
} from './notification-inbox-reconcile-cron.constants';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class NotificationInboxReconcileCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationInboxReconcileCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.notificationInboxReconcile;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: NOTIFICATION_INBOX_RECONCILE_CRON_ENABLED_ENV,
      cronEnvKey: NOTIFICATION_INBOX_RECONCILE_CRON_ENV,
      defaultExpression: NOTIFICATION_INBOX_RECONCILE_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runNotificationInboxReconcile('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
