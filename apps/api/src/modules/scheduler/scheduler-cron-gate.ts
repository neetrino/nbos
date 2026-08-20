import { shouldRegisterScheduledJobs, resolveProcessRole } from '../../runtime/process-role';
import { isSchedulerEnabled } from './scheduler-lease.constants';

/**
 * Why a CronJob must not be registered. `null` means role allows it.
 * Per-job enable is policy (DB), not env — checked on each tick.
 * Does not consider SCHEDULER_ENABLED — that only gates tick execution.
 */
export function describeCronSkipReason(
  _jobEnabledEnvKey?: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  if (!shouldRegisterScheduledJobs(env)) {
    return `role=${resolveProcessRole(env)}`;
  }
  return null;
}

/** Whether this process may register Nest CronJobs (role only). */
export function shouldStartCronJob(
  _jobEnabledEnvKey?: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return describeCronSkipReason(_jobEnabledEnvKey, env) === null;
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
