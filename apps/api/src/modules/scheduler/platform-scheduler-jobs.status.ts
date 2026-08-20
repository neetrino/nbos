import { CronJob } from 'cron';
import { SCHEDULER_JOB_KIND, type SchedulerJobCatalogEntry } from './scheduler-job-catalog';
import { SCHEDULER_RUN_STATUS } from './scheduler-lease.constants';

export const SCHEDULER_CATALOG_STATUS = {
  active: 'active',
  paused: 'paused',
  blocked: 'blocked',
  running: 'running',
  failed: 'failed',
  schedulerOffline: 'schedulerOffline',
  manual: 'manual',
  disabledByCanon: 'disabledByCanon',
} as const;

export type SchedulerCatalogStatus =
  (typeof SCHEDULER_CATALOG_STATUS)[keyof typeof SCHEDULER_CATALOG_STATUS];

export type CatalogRuntimeSnapshot = {
  jobName: string;
  masterEnabled: boolean;
  registered: boolean;
  expression: string | null;
  timezone: string;
  heartbeatAt: Date;
};

export type CatalogLastRunSnapshot = {
  jobName: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  errorMessage: string | null;
};

export type CatalogLeaseSnapshot = {
  jobName: string;
  leaseUntil: Date;
};

export function deriveCatalogStatus(input: {
  entry: SchedulerJobCatalogEntry;
  runtime: CatalogRuntimeSnapshot | null;
  lastRun: CatalogLastRunSnapshot | null;
  lease: CatalogLeaseSnapshot | null;
  policyEnabled: boolean | null;
  schedulerOnline: boolean;
  now: number;
}): SchedulerCatalogStatus {
  const { entry, runtime, lastRun, lease, policyEnabled, schedulerOnline, now } = input;

  if (entry.kind === SCHEDULER_JOB_KIND.manualOnly) {
    return SCHEDULER_CATALOG_STATUS.manual;
  }
  if (entry.kind === SCHEDULER_JOB_KIND.notACron) {
    return SCHEDULER_CATALOG_STATUS.disabledByCanon;
  }

  if (lastRun?.status === SCHEDULER_RUN_STATUS.RUNNING) {
    return SCHEDULER_CATALOG_STATUS.running;
  }
  if (lease !== null && lease.leaseUntil.getTime() > now) {
    return SCHEDULER_CATALOG_STATUS.running;
  }

  if (!schedulerOnline || runtime === null) {
    return SCHEDULER_CATALOG_STATUS.schedulerOffline;
  }

  if (
    lastRun?.status === SCHEDULER_RUN_STATUS.FAILED ||
    lastRun?.status === SCHEDULER_RUN_STATUS.TIMED_OUT
  ) {
    return SCHEDULER_CATALOG_STATUS.failed;
  }

  if (policyEnabled !== true) {
    return SCHEDULER_CATALOG_STATUS.paused;
  }

  if (!runtime.registered) {
    return SCHEDULER_CATALOG_STATUS.paused;
  }

  if (!runtime.masterEnabled) {
    return SCHEDULER_CATALOG_STATUS.blocked;
  }

  return SCHEDULER_CATALOG_STATUS.active;
}

export function computeNextRunAt(expression: string | null, timezone: string): string | null {
  if (expression === null || expression.trim().length === 0) return null;
  try {
    const job = new CronJob(expression, () => undefined, null, false, timezone);
    const next = job.nextDate();
    return next.toJSDate().toISOString();
  } catch {
    return null;
  }
}
