import { shouldRegisterScheduledJobs, resolveProcessRole } from '../../runtime/process-role';
import { isEnvFlagEnabled, isSchedulerEnabled } from './scheduler-lease.constants';

/**
 * Whether this process may register a Nest CronJob for the given per-job flag.
 * Dedicated scheduler requires SCHEDULER_ENABLED; local `all` may use job flags alone.
 */
export function shouldStartCronJob(
  jobEnabledEnvKey: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!shouldRegisterScheduledJobs(env)) return false;
  if (!isEnvFlagEnabled(jobEnabledEnvKey, env)) return false;
  const role = resolveProcessRole(env);
  if (role === 'scheduler' && !isSchedulerEnabled(env)) return false;
  return true;
}
