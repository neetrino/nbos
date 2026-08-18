import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { describeCronSkipReason, shouldRunCronTick } from './scheduler-cron-gate';

export type StartSchedulerCronJobArgs = {
  jobName: string;
  enabledEnvKey: string;
  cronEnvKey: string;
  defaultExpression: string;
  config: ConfigService;
  schedulerRegistry: SchedulerRegistry;
  jobRegistry: ScheduledJobRegistry;
  logger: Logger;
  run: () => Promise<unknown>;
};

function writeSchedulerCronStderr(message: string): void {
  process.stderr.write(`[SchedulerCron] ${message}\n`);
}

function resolveCronExpression(
  config: ConfigService,
  cronEnvKey: string,
  defaultExpression: string,
): string {
  const raw = config.get(cronEnvKey);
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return defaultExpression;
}

/** Register a Nest CronJob when role + per-job flag allow it. */
export function startSchedulerCronJob(args: StartSchedulerCronJobArgs): void {
  const { jobName, enabledEnvKey, cronEnvKey, defaultExpression } = args;
  const skipReason = describeCronSkipReason(enabledEnvKey);
  if (skipReason !== null) {
    const message = `Cron ${jobName} not registered (${skipReason}).`;
    args.logger.log(message);
    writeSchedulerCronStderr(message);
    return;
  }

  if (args.schedulerRegistry.doesExist('cron', jobName)) {
    args.jobRegistry.register(jobName);
    const message = `Cron ${jobName} already exists; registered in jobRegistry.`;
    args.logger.log(message);
    writeSchedulerCronStderr(message);
    return;
  }

  const expression = resolveCronExpression(args.config, cronEnvKey, defaultExpression);
  let job: CronJob;
  try {
    job = new CronJob(expression, () => {
      if (!shouldRunCronTick()) return;
      if (args.jobRegistry.isShuttingDown()) return;
      void args.run().catch((caught: unknown) => {
        args.logger.error(`Cron ${jobName} failed`, caught);
      });
    });
  } catch (caught) {
    args.logger.error(`Invalid cron for ${jobName}`, caught);
    writeSchedulerCronStderr(`Invalid cron for ${jobName}`);
    return;
  }

  try {
    args.schedulerRegistry.addCronJob(jobName, job);
    args.jobRegistry.register(jobName);
    if (shouldRunCronTick()) {
      job.start();
      const message = `Registered cron ${jobName} (${expression})`;
      args.logger.log(message);
      writeSchedulerCronStderr(message);
    } else {
      const message = `Registered cron ${jobName} (paused) (${expression})`;
      args.logger.log(message);
      writeSchedulerCronStderr(message);
    }
  } catch (caught) {
    args.logger.error(`Failed to add cron ${jobName}`, caught);
    writeSchedulerCronStderr(`Failed to add cron ${jobName}`);
  }
}

export function stopSchedulerCronJob(jobName: string, schedulerRegistry: SchedulerRegistry): void {
  if (schedulerRegistry.doesExist('cron', jobName)) {
    schedulerRegistry.deleteCronJob(jobName);
  }
}
