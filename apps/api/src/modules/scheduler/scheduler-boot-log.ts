import { type INestApplication, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { describeCronSkipReason } from './scheduler-cron-gate';
import { isEnvFlagEnabled, SCHEDULER_ENABLED_ENV } from './scheduler-lease.constants';

function listNestCronJobNames(app: INestApplication): string[] {
  const nestRegistry = app.get(SchedulerRegistry, { strict: false });
  if (!nestRegistry) return [];
  return [...nestRegistry.getCronJobs().keys()].sort();
}

/**
 * Unbuffered boot snapshot so Coolify crash-loop still shows why jobs are missing.
 * Does not change registration or the enabled-jobs assert.
 */
export function logSchedulerBootSnapshot(
  app: INestApplication,
  logger: Logger,
  knownJobFlagEnvKeys: readonly string[],
): void {
  const registry = app.get(ScheduledJobRegistry);
  const decisions = knownJobFlagEnvKeys.map((envKey) => {
    const skip = describeCronSkipReason(envKey);
    return `${envKey}=${skip ?? 'would register'}`;
  });
  const line = [
    `PROCESS_ROLE=${process.env.PROCESS_ROLE ?? ''}`,
    `${SCHEDULER_ENABLED_ENV}=${process.env[SCHEDULER_ENABLED_ENV] ?? ''}`,
    `jobFlags=${knownJobFlagEnvKeys.filter((envKey) => isEnvFlagEnabled(envKey)).join(',') || 'none'}`,
    `jobRegistry=${registry.list().join(',') || 'none'}`,
    `nestCrons=${listNestCronJobNames(app).join(',') || 'none'}`,
    `gate=${decisions.join('; ') || 'none'}`,
  ].join(' ');
  logger.log(line);
  process.stderr.write(`[SchedulerBootstrap] ${line}\n`);
}
