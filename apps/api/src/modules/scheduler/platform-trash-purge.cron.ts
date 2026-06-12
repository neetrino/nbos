import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PlatformTrashPurgeService } from '../platform-lifecycle/platform-trash-purge.service';
import {
  PLATFORM_TRASH_PURGE_CRON_ENV,
  PLATFORM_TRASH_PURGE_DEFAULT_CRON,
  PLATFORM_TRASH_PURGE_ENABLED_ENV,
  PLATFORM_TRASH_PURGE_JOB_NAME,
} from '../platform-lifecycle/platform-trash-purge.constants';

function isCronEnabled(config: ConfigService): boolean {
  const raw = config.get<string>(PLATFORM_TRASH_PURGE_ENABLED_ENV)?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function resolveCronExpression(config: ConfigService): string {
  const fromEnv = config.get<string>(PLATFORM_TRASH_PURGE_CRON_ENV)?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : PLATFORM_TRASH_PURGE_DEFAULT_CRON;
}

@Injectable()
export class PlatformTrashPurgeCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlatformTrashPurgeCron.name);

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly platformTrashPurgeService: PlatformTrashPurgeService,
  ) {}

  onModuleInit(): void {
    if (!isCronEnabled(this.config)) {
      this.logger.log(
        `Platform trash purge in-process cron is off (set ${PLATFORM_TRASH_PURGE_ENABLED_ENV}=true to enable).`,
      );
      return;
    }

    if (this.schedulerRegistry.doesExist('cron', PLATFORM_TRASH_PURGE_JOB_NAME)) {
      return;
    }

    const expression = resolveCronExpression(this.config);
    let job: CronJob;
    try {
      job = new CronJob(expression, () => {
        void this.runSafely();
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Invalid platform trash purge cron "${expression}": ${message}`);
      return;
    }

    this.schedulerRegistry.addCronJob(PLATFORM_TRASH_PURGE_JOB_NAME, job);
    job.start();
    this.logger.log(`Registered platform trash purge cron (${expression}).`);
  }

  onModuleDestroy(): void {
    if (!this.schedulerRegistry.doesExist('cron', PLATFORM_TRASH_PURGE_JOB_NAME)) {
      return;
    }
    this.schedulerRegistry.deleteCronJob(PLATFORM_TRASH_PURGE_JOB_NAME);
  }

  private async runSafely(): Promise<void> {
    try {
      await this.platformTrashPurgeService.runRetentionPurge();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Platform trash purge cron failed: ${message}`);
    }
  }
}
