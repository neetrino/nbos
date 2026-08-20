import type { SchedulerJobCatalogEntry } from './scheduler-job-catalog';
import { DEFAULT_SCHEDULER_RUNTIME_OFFLINE_AFTER_MS } from './scheduler-lease.constants';
import type { SchedulerJobPolicyRow } from './scheduler-job-policy.service';
import {
  mapPlatformSchedulerJobRow,
  type PlatformSchedulerJobRow,
} from './platform-scheduler-jobs.mapper';
import type {
  CatalogLastRunSnapshot,
  CatalogLeaseSnapshot,
  CatalogRuntimeSnapshot,
} from './platform-scheduler-jobs.status';

export const PLATFORM_SCHEDULER_JOBS_LIST_NOTE =
  'Enable/disable and Run now use SchedulerJobPolicy. Schedule (cron) changes only in code/deploy. SCHEDULER_ENABLED is the kill switch. Failure alerts stay on the ops monitoring backlog.';

export type PlatformSchedulerJobsResponse = {
  generatedAt: string;
  timezone: string;
  masterEnabled: boolean | null;
  schedulerOnline: boolean;
  note: string;
  jobs: PlatformSchedulerJobRow[];
};

export function buildPlatformSchedulerJobsResponse(input: {
  catalog: SchedulerJobCatalogEntry[];
  runtimes: CatalogRuntimeSnapshot[];
  lastRuns: CatalogLastRunSnapshot[];
  leases: CatalogLeaseSnapshot[];
  policies: Map<string, SchedulerJobPolicyRow>;
}): PlatformSchedulerJobsResponse {
  const { catalog, runtimes, lastRuns, leases, policies } = input;
  const runtimeByName = new Map(runtimes.map((row) => [row.jobName, row]));
  const lastRunByName = new Map(lastRuns.map((row) => [row.jobName, row]));
  const leaseByName = new Map(leases.map((row) => [row.jobName, row]));
  const now = Date.now();
  const freshestHeartbeat = runtimes.reduce<Date | null>((latest, row) => {
    if (latest === null || row.heartbeatAt > latest) return row.heartbeatAt;
    return latest;
  }, null);
  const schedulerOnline =
    freshestHeartbeat !== null &&
    now - freshestHeartbeat.getTime() <= DEFAULT_SCHEDULER_RUNTIME_OFFLINE_AFTER_MS;
  const masterEnabled =
    runtimes.find((row) => row.masterEnabled)?.masterEnabled ?? runtimes[0]?.masterEnabled ?? null;
  const timezone =
    runtimes.find((row) => row.timezone.trim().length > 0)?.timezone ??
    process.env.TZ?.trim() ??
    'Asia/Yerevan';
  const jobs = catalog.map((entry) => {
    const policy = policies.get(entry.jobName);
    return mapPlatformSchedulerJobRow({
      entry,
      runtime: runtimeByName.get(entry.jobName) ?? null,
      lastRun: lastRunByName.get(entry.jobName) ?? null,
      lease: leaseByName.get(entry.jobName) ?? null,
      policyEnabled: policy?.enabled ?? null,
      schedulerOnline,
      now,
      fallbackTimezone: timezone,
    });
  });
  return {
    generatedAt: new Date().toISOString(),
    timezone,
    masterEnabled,
    schedulerOnline,
    note: PLATFORM_SCHEDULER_JOBS_LIST_NOTE,
    jobs,
  };
}
