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
} from './scheduler-job-catalog';
import { SCHEDULER_TRIGGER } from './scheduler-lease.constants';
import { SchedulerJobPolicyService } from './scheduler-job-policy.service';
import {
  SCHEDULER_AUDIT_ACTION_JOB_DISABLED,
  SCHEDULER_AUDIT_ACTION_JOB_ENABLED,
  SCHEDULER_AUDIT_ACTION_JOB_RUN,
  SCHEDULER_AUDIT_ENTITY,
} from './scheduler-job-policy.constants';
import type { CatalogLastRunSnapshot } from './platform-scheduler-jobs.status';
import {
  buildPlatformSchedulerJobsResponse,
  type PlatformSchedulerJobsResponse,
} from './platform-scheduler-jobs.list';
import type { PlatformSchedulerJobRow } from './platform-scheduler-jobs.mapper';
import { canRunSchedulerJobNow, runSchedulerJobByName } from './scheduler-job-runner';
import { SchedulerAiService } from './scheduler-ai.service';
import { SchedulerService } from './scheduler.service';

export {
  computeNextRunAt,
  deriveCatalogStatus,
  SCHEDULER_CATALOG_STATUS,
  type SchedulerCatalogStatus,
} from './platform-scheduler-jobs.status';
export type { PlatformSchedulerJobRow } from './platform-scheduler-jobs.mapper';
export type { PlatformSchedulerJobsResponse } from './platform-scheduler-jobs.list';

export type PlatformSchedulerRunNowResponse = {
  jobName: string;
  trigger: typeof SCHEDULER_TRIGGER.manualAdmin;
  result: unknown;
};

@Injectable()
export class PlatformSchedulerJobsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly policyService: SchedulerJobPolicyService,
    private readonly auditService: AuditService,
    private readonly schedulerService: SchedulerService,
    private readonly schedulerAiService: SchedulerAiService,
  ) {}

  async listJobs(): Promise<PlatformSchedulerJobsResponse> {
    await this.policyService.seedMissingFromEnv();
    const catalog = listVisibleSchedulerJobs();
    const jobNames = catalog.map((entry) => entry.jobName);
    const platformNames = catalog
      .filter((entry) => entry.kind === SCHEDULER_JOB_KIND.platformCron)
      .map((entry) => entry.jobName);
    const [runtimes, lastRuns, leases, policies] = await Promise.all([
      this.prisma.schedulerJobRuntime.findMany({ where: { jobName: { in: jobNames } } }),
      this.loadLatestRuns(jobNames),
      this.prisma.schedulerLease.findMany({ where: { jobName: { in: jobNames } } }),
      this.policyService.listByJobNames(platformNames),
    ]);
    return buildPlatformSchedulerJobsResponse({
      catalog,
      runtimes,
      lastRuns,
      leases,
      policies,
    });
  }

  async setJobEnabled(input: {
    jobName: string;
    enabled: boolean;
    actorId: string;
    changeReason?: string;
  }): Promise<PlatformSchedulerJobRow> {
    const entry = this.requirePlatformCron(input.jobName);
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
    return this.requireJobRow(input.jobName);
  }

  async runJobNow(input: {
    jobName: string;
    actorId: string;
  }): Promise<PlatformSchedulerRunNowResponse> {
    const entry = getSchedulerJobCatalogEntry(input.jobName);
    if (!entry || entry.visibility !== SCHEDULER_JOB_VISIBILITY.list) {
      throw new NotFoundException(`Unknown scheduler job: ${input.jobName}`);
    }
    if (!canRunSchedulerJobNow(input.jobName)) {
      throw new BadRequestException(`Job ${input.jobName} cannot be run from Settings`);
    }
    const result = await runSchedulerJobByName(
      { scheduler: this.schedulerService, ai: this.schedulerAiService },
      input.jobName,
      SCHEDULER_TRIGGER.manualAdmin,
    );
    await this.auditService.log({
      entityType: SCHEDULER_AUDIT_ENTITY,
      entityId: input.jobName,
      action: SCHEDULER_AUDIT_ACTION_JOB_RUN,
      userId: input.actorId,
      changes: {
        jobName: input.jobName,
        trigger: SCHEDULER_TRIGGER.manualAdmin,
        risk: entry.risk,
        result,
      } as InputJsonValue,
    });
    return {
      jobName: input.jobName,
      trigger: SCHEDULER_TRIGGER.manualAdmin,
      result,
    };
  }

  private requirePlatformCron(jobName: string): SchedulerJobCatalogEntry {
    const entry = getSchedulerJobCatalogEntry(jobName);
    if (!entry || entry.visibility !== SCHEDULER_JOB_VISIBILITY.list) {
      throw new NotFoundException(`Unknown scheduler job: ${jobName}`);
    }
    if (entry.kind !== SCHEDULER_JOB_KIND.platformCron) {
      throw new BadRequestException(`Job ${jobName} is not a platform cron`);
    }
    return entry;
  }

  private async requireJobRow(jobName: string): Promise<PlatformSchedulerJobRow> {
    const list = await this.listJobs();
    const row = list.jobs.find((job) => job.jobName === jobName);
    if (!row) {
      throw new NotFoundException(`Scheduler job missing after update: ${jobName}`);
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
}
