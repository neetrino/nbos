import { toBullMqSafeJobId } from '@nbos/shared';

export const SCHEDULER_EXECUTION_QUEUE_NAME = 'scheduler-executions';
export const SCHEDULER_EXECUTION_JOB_NAME = 'scheduler-execution';

export const SCHEDULER_OCCURRENCE_STATUS = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type SchedulerOccurrenceStatus =
  (typeof SCHEDULER_OCCURRENCE_STATUS)[keyof typeof SCHEDULER_OCCURRENCE_STATUS];

export const SCHEDULER_OCCURRENCE_RECONCILE_INTERVAL_MS = 60_000;
export const SCHEDULER_OCCURRENCE_RECONCILE_BATCH = 50;
export const SCHEDULER_LEASE_RETRY_DELAY_MS = 15_000;
export const SCHEDULER_OCCURRENCE_RECONCILE_LEASE = 'scheduler-occurrence-reconcile';
export const SCHEDULER_RUNNING_STALE_MULTIPLIER = 2;

const OPEN_OCCURRENCE_STATUSES = [
  SCHEDULER_OCCURRENCE_STATUS.PENDING,
  SCHEDULER_OCCURRENCE_STATUS.QUEUED,
  SCHEDULER_OCCURRENCE_STATUS.RUNNING,
] as const;

export function isOpenSchedulerOccurrenceStatus(status: string): boolean {
  return (OPEN_OCCURRENCE_STATUSES as readonly string[]).includes(status);
}

/** BullMQ job id for one logical firing. Re-enqueue uses the same id. */
export function schedulerExecutionJobId(jobName: string, scheduledFor: Date): string {
  return toBullMqSafeJobId(`scheduler:${jobName}:${scheduledFor.toISOString()}`);
}
