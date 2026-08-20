import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  getSchedulerJobCatalogEntry,
  listVisibleSchedulerJobs,
  SCHEDULER_JOB_KIND,
  SCHEDULER_JOB_VISIBILITY,
  type SchedulerJobCatalogEntry,
  type SchedulerJobKind,
  type SchedulerJobRisk,
  type SchedulerRosterIntent,
} from './scheduler-job-catalog';
import { DEFAULT_SCHEDULER_RUNTIME_OFFLINE_AFTER_MS } from './scheduler-lease.constants';
import { SchedulerJobPolicyService } from './scheduler-job-policy.service';
import {
  SCHEDULER_AUDIT_ACTION_JOB_DISABLED,
  SCHEDULER_AUDIT_ACTION_JOB_ENABLED,
  SCHEDULER_AUDIT_ENTITY,
} from './scheduler-job-policy.constants';
import {
  computeNextRunAt,
  deriveCatalogStatus,
  type CatalogLastRunSnapshot,
  type CatalogLeaseSnapshot,
  type CatalogRuntimeSnapshot,
  type SchedulerCatalogStatus,
} from './platform-scheduler-jobs.status';

export {
  computeNextRunAt,
  deriveCatalogStatus,
  SCHEDULER_CATALOG_STATUS,
  type SchedulerCatalogStatus,
} from './platform-scheduler-jobs.status';

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
};

export type PlatformSchedulerJobsResponse = {
  generatedAt: string;
  timezone: string;
  masterEnabled: boolean | null;
  schedulerOnline: boolean;
  note: string;
  jobs: PlatformSchedulerJobRow[];
};

@Injectable()
export class PlatformSchedulerJobsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly policyService: SchedulerJobPolicyService,
    private readonly auditService: AuditService,
  ) {}

  async listJobs(): Promise<PlatformSchedulerJobsResponse> {
    await this.policyService.seedMissingFromEnv();
    const catalog = listVisibleSchedulerJobs();
    const jobNames = catalog.map((entry) => entry.jobName);
    const platformNames = catalog
      .filter((entry) => entry.kind === SCHEDULER_JOB_KIND.platformCron)
      .map((entry) => entry.jobName);

    const [runtimes, lastRuns, leases, policies] = await Promise.all([
      this.prisma.schedulerJobRuntime.findMany({
        where: { jobName: { in: jobNames } },
      }),
      this.loadLatestRuns(jobNames),
      this.prisma.schedulerLease.findMany({
        where: { jobName: { in: jobNames } },
      }),
      this.policyService.listByJobNames(platformNames),
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

    const jobs = catalog.map((entry) => {
      const policy = policies.get(entry.jobName);
      return this.toRow({
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
      note: 'BullMQ workers and IMAP IDLE are not listed here. Enable/disable is stored in SchedulerJobPolicy; SCHEDULER_ENABLED remains the process kill switch.',
      jobs,
    };
  }

  async setJobEnabled(input: {
    jobName: string;
    enabled: boolean;
    actorId: string;
    changeReason?: string;
  }): Promise<PlatformSchedulerJobRow> {
    const entry = getSchedulerJobCatalogEntry(input.jobName);
    if (!entry || entry.visibility !== SCHEDULER_JOB_VISIBILITY.list) {
      throw new NotFoundException(`Unknown scheduler job: ${input.jobName}`);
    }
    if (entry.kind !== SCHEDULER_JOB_KIND.platformCron) {
      throw new BadRequestException(`Job ${input.jobName} cannot be toggled`);
    }

    await this.policyService.seedMissingFromEnv();
    const result = await this.policyService.setEnabled({
      jobName: input.jobName,
      enabled: input.enabled,
      actorId: input.actorId,
    });

    await this.auditService.log({
      entityType: SCHEDULER_AUDIT_ENTITY,
      entityId: input.jobName,
      action: input.enabled
        ? SCHEDULER_AUDIT_ACTION_JOB_ENABLED
        : SCHEDULER_AUDIT_ACTION_JOB_DISABLED,
      userId: input.actorId,
      changes: {
        before: { enabled: result.previousEnabled },
        after: { enabled: result.enabled },
        jobName: input.jobName,
        changeReason: input.changeReason?.trim() || null,
        risk: entry.risk,
      } as InputJsonValue,
    });

    const list = await this.listJobs();
    const row = list.jobs.find((job) => job.jobName === input.jobName);
    if (!row) {
      throw new NotFoundException(`Scheduler job missing after update: ${input.jobName}`);
    }
    return row;
  }

  private async loadLatestRuns(jobNames: string[]): Promise<CatalogLastRunSnapshot[]> {
    if (jobNames.length === 0) return [];
    const rows: CatalogLastRunSnapshot[] = [];
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
    runtime: CatalogRuntimeSnapshot | null;
    lastRun: CatalogLastRunSnapshot | null;
    lease: CatalogLeaseSnapshot | null;
    policyEnabled: boolean | null;
    schedulerOnline: boolean;
    now: number;
    fallbackTimezone: string;
  }): PlatformSchedulerJobRow {
    const {
      entry,
      runtime,
      lastRun,
      lease,
      policyEnabled,
      schedulerOnline,
      now,
      fallbackTimezone,
    } = input;
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
    };
  }
}
