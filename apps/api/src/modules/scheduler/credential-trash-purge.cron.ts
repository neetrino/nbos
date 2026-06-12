import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CredentialsTrashPurgeService } from '../credentials/credentials-trash-purge.service';
import {
  CREDENTIAL_TRASH_PURGE_CRON_ENV,
  CREDENTIAL_TRASH_PURGE_DEFAULT_CRON,
  CREDENTIAL_TRASH_PURGE_ENABLED_ENV,
  CREDENTIAL_TRASH_PURGE_JOB_NAME,
} from '../credentials/credential-trash-retention.constants';

function isCronEnabled(config: ConfigService): boolean {
  const raw = config.get<string>(CREDENTIAL_TRASH_PURGE_ENABLED_ENV)?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function resolveCronExpression(config: ConfigService): string {
  const fromEnv = config.get<string>(CREDENTIAL_TRASH_PURGE_CRON_ENV)?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : CREDENTIAL_TRASH_PURGE_DEFAULT_CRON;
}

@Injectable()
export class CredentialTrashPurgeCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CredentialTrashPurgeCron.name);

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly credentialsTrashPurgeService: CredentialsTrashPurgeService,
  ) {}

  onModuleInit(): void {
    if (!isCronEnabled(this.config)) {
      this.logger.log(
        `Credential trash purge in-process cron is off (set ${CREDENTIAL_TRASH_PURGE_ENABLED_ENV}=true to enable).`,
      );
      return;
    }

    if (this.schedulerRegistry.doesExist('cron', CREDENTIAL_TRASH_PURGE_JOB_NAME)) {
      this.logger.warn(
        `Cron "${CREDENTIAL_TRASH_PURGE_JOB_NAME}" already exists; skipping registration.`,
      );
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
      this.logger.error(
        `Invalid ${CREDENTIAL_TRASH_PURGE_CRON_ENV}="${expression}": ${message}. In-process cron not started.`,
      );
      return;
    }

    this.schedulerRegistry.addCronJob(CREDENTIAL_TRASH_PURGE_JOB_NAME, job);
    job.start();
    this.logger.log(
      `Registered in-process cron "${CREDENTIAL_TRASH_PURGE_JOB_NAME}" (${expression}) → credential trash retention purge.`,
    );
  }

  onModuleDestroy(): void {
    if (!this.schedulerRegistry.doesExist('cron', CREDENTIAL_TRASH_PURGE_JOB_NAME)) {
      return;
    }
    this.schedulerRegistry.deleteCronJob(CREDENTIAL_TRASH_PURGE_JOB_NAME);
  }

  private async runSafely(): Promise<void> {
    try {
      await this.credentialsTrashPurgeService.runRetentionPurge();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      this.logger.error(`Credential trash purge cron tick failed: ${message}`);
    }
  }
}
