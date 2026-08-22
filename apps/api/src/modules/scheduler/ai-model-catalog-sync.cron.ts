import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  AI_MODEL_CATALOG_SYNC_CRON_ENV,
  AI_MODEL_CATALOG_SYNC_DEFAULT_CRON,
  AI_MODEL_CATALOG_SYNC_ENABLED_ENV,
} from '../ai-platform/providers/ai-provider.constants';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { SchedulerAiService } from './scheduler-ai.service';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';

@Injectable()
export class AiModelCatalogSyncCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiModelCatalogSyncCron.name);
  private readonly jobName = SCHEDULER_JOB_NAMES.aiModelCatalogSync;

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerAi: SchedulerAiService,
    private readonly jobRegistry: ScheduledJobRegistry,
  ) {}

  onModuleInit(): void {
    startSchedulerCronJob({
      jobName: this.jobName,
      enabledEnvKey: AI_MODEL_CATALOG_SYNC_ENABLED_ENV,
      cronEnvKey: AI_MODEL_CATALOG_SYNC_CRON_ENV,
      defaultExpression: AI_MODEL_CATALOG_SYNC_DEFAULT_CRON,
      config: this.config,
      schedulerRegistry: this.schedulerRegistry,
      jobRegistry: this.jobRegistry,
      logger: this.logger,
      run: () => this.schedulerAi.runAiModelCatalogSync('cron'),
    });
  }

  onModuleDestroy(): void {
    stopSchedulerCronJob(this.jobName, this.schedulerRegistry);
  }
}
