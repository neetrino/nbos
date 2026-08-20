import {
  SCHEDULER_JOB_KIND,
  type SchedulerJobCatalogEntry,
  type SchedulerJobKind,
  type SchedulerJobRisk,
  type SchedulerRosterIntent,
} from './scheduler-job-catalog';
import {
  computeNextRunAt,
  deriveCatalogStatus,
  type CatalogLastRunSnapshot,
  type CatalogLeaseSnapshot,
  type CatalogRuntimeSnapshot,
  type SchedulerCatalogStatus,
} from './platform-scheduler-jobs.status';
import { canRunSchedulerJobNow } from './scheduler-job-runner';

export type PlatformSchedulerJobRow = {
  jobName: string;
  title: string;
  description: string;
  ownerModule: string;
  group: string;
  risk: SchedulerJobRisk;
  kind: SchedulerJobKind;
  rosterIntent: SchedulerRosterIntent;
  defaultExpression: string | null;
  expression: string | null;
  timezone: string | null;
  status: SchedulerCatalogStatus;
  /** @deprecated use policyEnabled — kept for stage-1 clients */
  enabledByEnv: boolean | null;
  policyEnabled: boolean | null;
  masterEnabled: boolean | null;
  registered: boolean | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastErrorMessage: string | null;
  nextRunAt: string | null;
  runtimeHeartbeatAt: string | null;
  canToggle: boolean;
  canRunNow: boolean;
};

export function mapPlatformSchedulerJobRow(input: {
  entry: SchedulerJobCatalogEntry;
  runtime: CatalogRuntimeSnapshot | null;
  lastRun: CatalogLastRunSnapshot | null;
  lease: CatalogLeaseSnapshot | null;
  policyEnabled: boolean | null;
  schedulerOnline: boolean;
  now: number;
  fallbackTimezone: string;
}): PlatformSchedulerJobRow {
  const { entry, runtime, lastRun, lease, policyEnabled, schedulerOnline, now, fallbackTimezone } =
    input;
  const expression = runtime?.expression ?? entry.defaultExpression;
  const timezone = runtime?.timezone ?? fallbackTimezone;
  const status = deriveCatalogStatus({
    entry,
    runtime,
    lastRun,
    lease,
    policyEnabled,
    schedulerOnline,
    now,
  });

  return {
    jobName: entry.jobName,
    title: entry.title,
    description: entry.description,
    ownerModule: entry.ownerModule,
    group: entry.group,
    risk: entry.risk,
    kind: entry.kind,
    rosterIntent: entry.rosterIntent,
    defaultExpression: entry.defaultExpression,
    expression,
    timezone: runtime?.timezone ?? null,
    status,
    enabledByEnv: policyEnabled,
    policyEnabled,
    masterEnabled: runtime?.masterEnabled ?? null,
    registered: runtime?.registered ?? null,
    lastRunAt: lastRun?.startedAt.toISOString() ?? null,
    lastRunStatus: lastRun?.status ?? null,
    lastErrorMessage: lastRun?.errorMessage ?? null,
    nextRunAt: computeNextRunAt(expression, timezone),
    runtimeHeartbeatAt: runtime?.heartbeatAt.toISOString() ?? null,
    canToggle: entry.kind === SCHEDULER_JOB_KIND.platformCron,
    canRunNow: canRunSchedulerJobNow(entry.jobName),
  };
}
