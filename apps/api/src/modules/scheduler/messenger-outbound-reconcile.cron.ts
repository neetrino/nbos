import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  MESSENGER_OUTBOUND_RECONCILE_CRON_ENV,
  MESSENGER_OUTBOUND_RECONCILE_DEFAULT_CRON,
  MESSENGER_OUTBOUND_RECONCILE_ENABLED_ENV,
} from '../messenger/core/messenger-outbound-reconcile.constants';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class MessengerOutboundReconcileCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessengerOutboundReconcileCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.messengerOutboundReconcile;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: MESSENGER_OUTBOUND_RECONCILE_ENABLED_ENV,
      cronEnvKey: MESSENGER_OUTBOUND_RECONCILE_CRON_ENV,
      defaultExpression: MESSENGER_OUTBOUND_RECONCILE_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runMessengerOutboundReconcile('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
