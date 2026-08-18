import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import {
  CLIENT_SERVICES_RENEWAL_INVOICE_CRON_ENV,
  CLIENT_SERVICES_RENEWAL_INVOICE_DEFAULT_CRON,
  CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED_ENV,
} from './client-services-renewal-invoice-cron.constants';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class ClientServicesRenewalInvoiceCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClientServicesRenewalInvoiceCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.clientServicesRenewalInvoice;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerService: SchedulerService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED_ENV,
      cronEnvKey: CLIENT_SERVICES_RENEWAL_INVOICE_CRON_ENV,
      defaultExpression: CLIENT_SERVICES_RENEWAL_INVOICE_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerService.runClientServicesRenewalInvoice('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
