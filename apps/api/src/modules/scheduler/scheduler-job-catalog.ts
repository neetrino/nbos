import { SCHEDULER_PLATFORM_CRON_CATALOG } from './scheduler-job-catalog.entries';
import {
  SALES_KPI_BACKFILL_ALL_JOB_NAME,
  SCHEDULER_JOB_GROUP,
  SCHEDULER_JOB_KIND,
  SCHEDULER_JOB_RISK,
  SCHEDULER_JOB_VISIBILITY,
  SCHEDULER_ROSTER_INTENT,
  type SchedulerCatalogJobName,
  type SchedulerJobCatalogEntry,
} from './scheduler-job-catalog.types';

export {
  SALES_KPI_BACKFILL_ALL_JOB_NAME,
  SCHEDULER_JOB_GROUP,
  SCHEDULER_JOB_KIND,
  SCHEDULER_JOB_RISK,
  SCHEDULER_JOB_VISIBILITY,
  SCHEDULER_ROSTER_INTENT,
  type SchedulerCatalogJobName,
  type SchedulerJobCatalogEntry,
  type SchedulerJobGroup,
  type SchedulerJobKind,
  type SchedulerJobRisk,
  type SchedulerJobVisibility,
  type SchedulerRosterIntent,
} from './scheduler-job-catalog.types';

const SALES_KPI_BACKFILL_ENTRY: SchedulerJobCatalogEntry = {
  jobName: SALES_KPI_BACKFILL_ALL_JOB_NAME,
  title: 'Sales KPI backfill all',
  description: 'Manual repair: backfill all sales KPI periods. No cron.',
  ownerModule: 'Finance',
  group: SCHEDULER_JOB_GROUP.money,
  defaultExpression: null,
  enabledEnvKey: null,
  cronEnvKey: null,
  risk: SCHEDULER_JOB_RISK.high,
  kind: SCHEDULER_JOB_KIND.manualOnly,
  rosterIntent: SCHEDULER_ROSTER_INTENT.manual,
  visibility: SCHEDULER_JOB_VISIBILITY.list,
};

/** Full visible catalog: Nest crons + manual-only repair jobs. */
export const SCHEDULER_JOB_CATALOG: readonly SchedulerJobCatalogEntry[] = [
  ...SCHEDULER_PLATFORM_CRON_CATALOG,
  SALES_KPI_BACKFILL_ENTRY,
];

const CATALOG_BY_NAME = new Map(
  SCHEDULER_JOB_CATALOG.map((entry) => [entry.jobName, entry] as const),
);

export function listVisibleSchedulerJobs(): SchedulerJobCatalogEntry[] {
  return SCHEDULER_JOB_CATALOG.filter(
    (entry) => entry.visibility === SCHEDULER_JOB_VISIBILITY.list,
  );
}

export function getSchedulerJobCatalogEntry(jobName: string): SchedulerJobCatalogEntry | undefined {
  return CATALOG_BY_NAME.get(jobName as SchedulerCatalogJobName);
}

export function listRosterOnPlatformCronJobNames(): string[] {
  return SCHEDULER_JOB_CATALOG.filter(
    (entry) =>
      entry.kind === SCHEDULER_JOB_KIND.platformCron &&
      entry.rosterIntent === SCHEDULER_ROSTER_INTENT.on,
  )
    .map((entry) => entry.jobName)
    .sort();
}

export function listPlatformCronCatalogEntries(): SchedulerJobCatalogEntry[] {
  return SCHEDULER_JOB_CATALOG.filter((entry) => entry.kind === SCHEDULER_JOB_KIND.platformCron);
}
