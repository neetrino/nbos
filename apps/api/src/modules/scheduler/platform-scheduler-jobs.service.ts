import { Inject, Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  listVisibleSchedulerJobs,
  SCHEDULER_JOB_KIND,
  type SchedulerJobCatalogEntry,
  type SchedulerJobKind,
  type SchedulerJobRisk,
  type SchedulerRosterIntent,
} from './scheduler-job-catalog';
import {
  DEFAULT_SCHEDULER_RUNTIME_OFFLINE_AFTER_MS,
  SCHEDULER_RUN_STATUS,
} from './scheduler-lease.constants';

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
  enabledByEnv: boolean | null;
  masterEnabled: boolean | null;
  registered: boolean | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastErrorMessage: string | null;
  nextRunAt: string | null;
  runtimeHeartbeatAt: string | null;
};

export type PlatformSchedulerJobsResponse = {
  generatedAt: string;
  timezone: string;
  masterEnabled: boolean | null;
  schedulerOnline: boolean;
  note: string;
  jobs: PlatformSchedulerJobRow[];
};

type RuntimeRow = {
  jobName: string;
  masterEnabled: boolean;
  registered: boolean;
  enabledByEnv: boolean;
  expression: string | null;
  timezone: string;
  heartbeatAt: Date;
  schedulerOwnerId: string;
};

type LastRunRow = {
  jobName: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  errorMessage: string | null;
};

type LeaseRow = {
  jobName: string;
  leaseUntil: Date;
};

@Injectable()
export class PlatformSchedulerJobsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listJobs(): Promise<PlatformSchedulerJobsResponse> {
    const catalog = listVisibleSchedulerJobs();
    const jobNames = catalog.map((entry) => entry.jobName);

    const [runtimes, lastRuns, leases] = await Promise.all([
      this.prisma.schedulerJobRuntime.findMany({
        where: { jobName: { in: jobNames } },
      }),
      this.loadLatestRuns(jobNames),
      this.prisma.schedulerLease.findMany({
        where: { jobName: { in: jobNames } },
      }),
    ]);

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
      runtimes.find((row) => row.masterEnabled)?.masterEnabled ??
      runtimes[0]?.masterEnabled ??
      null;

    const timezone =
      runtimes.find((row) => row.timezone.trim().length > 0)?.timezone ??
      process.env.TZ?.trim() ??
      'Asia/Yerevan';

    const jobs = catalog.map((entry) =>
      this.toRow({
        entry,
        runtime: runtimeByName.get(entry.jobName) ?? null,
        lastRun: lastRunByName.get(entry.jobName) ?? null,
        lease: leaseByName.get(entry.jobName) ?? null,
        schedulerOnline,
        now,
        fallbackTimezone: timezone,
      }),
    );

    return {
      generatedAt: new Date().toISOString(),
      timezone,
      masterEnabled,
      schedulerOnline,
      note: 'BullMQ workers and IMAP IDLE are not listed here. User schedules (reports, recurring tasks) appear only via their platform tick jobs.',
      jobs,
    };
  }

  private async loadLatestRuns(jobNames: string[]): Promise<LastRunRow[]> {
    if (jobNames.length === 0) return [];
    const rows: LastRunRow[] = [];
    for (const jobName of jobNames) {
      const latest = await this.prisma.schedulerRun.findFirst({
        where: { jobName },
        orderBy: { startedAt: 'desc' },
        select: {
          jobName: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          errorMessage: true,
        },
      });
      if (latest) rows.push(latest);
    }
    return rows;
  }

  private toRow(input: {
    entry: SchedulerJobCatalogEntry;
    runtime: RuntimeRow | null;
    lastRun: LastRunRow | null;
    lease: LeaseRow | null;
    schedulerOnline: boolean;
    now: number;
    fallbackTimezone: string;
  }): PlatformSchedulerJobRow {
    const { entry, runtime, lastRun, lease, schedulerOnline, now, fallbackTimezone } = input;
    const expression = runtime?.expression ?? entry.defaultExpression;
    const timezone = runtime?.timezone ?? fallbackTimezone;
    const status = deriveCatalogStatus({
      entry,
      runtime,
      lastRun,
      lease,
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
      enabledByEnv: runtime?.enabledByEnv ?? null,
      masterEnabled: runtime?.masterEnabled ?? null,
      registered: runtime?.registered ?? null,
      lastRunAt: lastRun?.startedAt.toISOString() ?? null,
      lastRunStatus: lastRun?.status ?? null,
      lastErrorMessage: lastRun?.errorMessage ?? null,
      nextRunAt: computeNextRunAt(expression, timezone),
      runtimeHeartbeatAt: runtime?.heartbeatAt.toISOString() ?? null,
    };
  }
}

export function deriveCatalogStatus(input: {
  entry: SchedulerJobCatalogEntry;
  runtime: RuntimeRow | null;
  lastRun: LastRunRow | null;
  lease: LeaseRow | null;
  schedulerOnline: boolean;
  now: number;
}): SchedulerCatalogStatus {
  const { entry, runtime, lastRun, lease, schedulerOnline, now } = input;

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

  if (!runtime.enabledByEnv || !runtime.registered) {
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
