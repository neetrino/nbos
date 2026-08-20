import { SCHEDULER_JOB_NAMES, type SchedulerJobName } from './scheduler-lease.constants';

export const SCHEDULER_JOB_RISK = {
  low: 'low',
  medium: 'medium',
  high: 'high',
} as const;

export type SchedulerJobRisk = (typeof SCHEDULER_JOB_RISK)[keyof typeof SCHEDULER_JOB_RISK];

export const SCHEDULER_JOB_KIND = {
  platformCron: 'platform_cron',
  manualOnly: 'manual_only',
  notACron: 'not_a_cron',
} as const;

export type SchedulerJobKind = (typeof SCHEDULER_JOB_KIND)[keyof typeof SCHEDULER_JOB_KIND];

export const SCHEDULER_ROSTER_INTENT = {
  on: 'on',
  off: 'off',
  manual: 'manual',
} as const;

export type SchedulerRosterIntent =
  (typeof SCHEDULER_ROSTER_INTENT)[keyof typeof SCHEDULER_ROSTER_INTENT];

export const SCHEDULER_JOB_VISIBILITY = {
  list: 'list',
  hidden: 'hidden',
} as const;

export type SchedulerJobVisibility =
  (typeof SCHEDULER_JOB_VISIBILITY)[keyof typeof SCHEDULER_JOB_VISIBILITY];

export const SCHEDULER_JOB_GROUP = {
  money: 'Money',
  tasksAndPlans: 'Tasks and plans',
  trash: 'Trash',
  support: 'Support',
  sessions: 'Sessions',
  mail: 'Mail',
  reports: 'Reports',
} as const;

export type SchedulerJobGroup = (typeof SCHEDULER_JOB_GROUP)[keyof typeof SCHEDULER_JOB_GROUP];

/** Manual HTTP-only repair job (no Nest cron). */
export const SALES_KPI_BACKFILL_ALL_JOB_NAME = 'sales-kpi-backfill-all' as const;

export type SchedulerCatalogJobName = SchedulerJobName | typeof SALES_KPI_BACKFILL_ALL_JOB_NAME;

export type SchedulerJobCatalogEntry = {
  jobName: SchedulerCatalogJobName;
  title: string;
  description: string;
  ownerModule: string;
  group: SchedulerJobGroup;
  defaultExpression: string | null;
  enabledEnvKey: string | null;
  cronEnvKey: string | null;
  risk: SchedulerJobRisk;
  kind: SchedulerJobKind;
  rosterIntent: SchedulerRosterIntent;
  visibility: SchedulerJobVisibility;
};

export function platformCronEntry(entry: {
  jobName: SchedulerJobName;
  title: string;
  description: string;
  ownerModule: string;
  group: SchedulerJobGroup;
  defaultExpression: string;
  enabledEnvKey: string;
  cronEnvKey: string;
  risk: SchedulerJobRisk;
  rosterIntent: SchedulerRosterIntent;
}): SchedulerJobCatalogEntry {
  return {
    ...entry,
    kind: SCHEDULER_JOB_KIND.platformCron,
    visibility: SCHEDULER_JOB_VISIBILITY.list,
  };
}
