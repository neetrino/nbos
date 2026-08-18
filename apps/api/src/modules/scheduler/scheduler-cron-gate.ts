import { shouldRegisterScheduledJobs, resolveProcessRole } from '../../runtime/process-role';
import {
  isEnvFlagEnabled,
  isSchedulerEnabled,
  SCHEDULER_ENABLED_ENV,
} from './scheduler-lease.constants';

/**
 * Why a CronJob must not be registered. `null` means role + master + job flag allow it.
 * Dedicated scheduler still requires `SCHEDULER_ENABLED`; local `all` may use job flags alone.
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
  const role = resolveProcessRole(env);
  if (role === 'scheduler' && !isSchedulerEnabled(env)) {
    return env[SCHEDULER_ENABLED_ENV] === undefined
      ? `${SCHEDULER_ENABLED_ENV} unset`
      : `${SCHEDULER_ENABLED_ENV} off`;
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
