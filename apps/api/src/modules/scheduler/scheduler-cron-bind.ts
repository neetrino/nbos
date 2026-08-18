import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { shouldStartCronJob } from './scheduler-cron-gate';

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

/** Register a Nest CronJob when role + per-job flag allow it. */
export function startSchedulerCronJob(args: StartSchedulerCronJobArgs): void {
  const { jobName, enabledEnvKey, cronEnvKey, defaultExpression } = args;
  if (!shouldStartCronJob(enabledEnvKey)) {
    args.logger.log(`Cron ${jobName} not registered (role/flags).`);
    return;
  }
  if (args.schedulerRegistry.doesExist('cron', jobName)) return;

  const expression = args.config.get<string>(cronEnvKey)?.trim() || defaultExpression;
  let job: CronJob;
  try {
    job = new CronJob(expression, () => {
      if (args.jobRegistry.isShuttingDown()) return;
      void args.run().catch((caught: unknown) => {
        args.logger.error(`Cron ${jobName} failed`, caught);
      });
    });
  } catch (caught) {
    args.logger.error(`Invalid cron for ${jobName}`, caught);
    return;
  }
  args.schedulerRegistry.addCronJob(jobName, job);
  job.start();
  args.jobRegistry.register(jobName);
  args.logger.log(`Registered cron ${jobName} (${expression})`);
}

export function stopSchedulerCronJob(jobName: string, schedulerRegistry: SchedulerRegistry): void {
  if (schedulerRegistry.doesExist('cron', jobName)) {
    schedulerRegistry.deleteCronJob(jobName);
  }
}
