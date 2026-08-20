import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  AUTH_SESSION_CLEANUP_CRON_ENABLED_ENV,
  AUTH_SESSION_CLEANUP_CRON_ENV,
  AUTH_SESSION_CLEANUP_DEFAULT_CRON,
} from './auth-session-cleanup-cron.constants';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class AuthSessionCleanupCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthSessionCleanupCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.authSessionExpiryCleanup;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: AUTH_SESSION_CLEANUP_CRON_ENABLED_ENV,
      cronEnvKey: AUTH_SESSION_CLEANUP_CRON_ENV,
      defaultExpression: AUTH_SESSION_CLEANUP_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runAuthSessionExpiryCleanup('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
