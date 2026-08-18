import { shouldRegisterScheduledJobs, resolveProcessRole } from '../../runtime/process-role';
import { isEnvFlagEnabled, isSchedulerEnabled } from './scheduler-lease.constants';

/**
 * Why a CronJob must not be registered. `null` means role + job flag allow it.
 * Does not consider SCHEDULER_ENABLED — that only gates tick execution.
 */
export function describeCronSkipReason(
  jobEnabledEnvKey: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  if (!shouldRegisterScheduledJobs(env)) {
    return `role=${resolveProcessRole(env)}`;
  }
  if (!isEnvFlagEnabled(jobEnabledEnvKey, env)) {
    return `job flag ${jobEnabledEnvKey} off`;
  }
  return null;
}

/** Whether this process may register a Nest CronJob for the given per-job flag. */
export function shouldStartCronJob(
  jobEnabledEnvKey: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return describeCronSkipReason(jobEnabledEnvKey, env) === null;
}

/** Whether registered cron ticks may run (master switch for dedicated scheduler). */
export function shouldRunCronTick(env: NodeJS.ProcessEnv = process.env): boolean {
  const role = resolveProcessRole(env);
  if (role === 'all') {
    return true;
  }
  if (role === 'scheduler') {
    return isSchedulerEnabled(env);
  }
  return false;
}
