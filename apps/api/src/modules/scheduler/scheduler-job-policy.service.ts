import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  listPlatformCronCatalogEntries,
  SCHEDULER_ROSTER_INTENT,
  type SchedulerJobCatalogEntry,
} from './scheduler-job-catalog';
import { isEnvFlagEnabled } from './scheduler-lease.constants';
import { setSchedulerJobPolicyChecker } from './scheduler-job-policy.accessor';

@Injectable()
export class SchedulerJobPolicyService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerJobPolicyService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  onModuleInit(): void {
    setSchedulerJobPolicyChecker((jobName) => this.isEnabled(jobName));
  }

  async isEnabled(jobName: string): Promise<boolean> {
    const row = await this.prisma.schedulerJobPolicy.findUnique({
      where: { jobName },
      select: { enabled: true },
    });
    return row?.enabled === true;
  }

  async listByJobNames(
    jobNames: string[],
  ): Promise<Map<string, { enabled: boolean; updatedById: string | null; updatedAt: Date }>> {
    if (jobNames.length === 0) return new Map();
    const rows = await this.prisma.schedulerJobPolicy.findMany({
      where: { jobName: { in: jobNames } },
      select: { jobName: true, enabled: true, updatedById: true, updatedAt: true },
    });
    return new Map(
      rows.map((row) => [
        row.jobName,
        { enabled: row.enabled, updatedById: row.updatedById, updatedAt: row.updatedAt },
      ]),
    );
  }

  /**
   * Insert missing policies only. Existing rows are never overwritten by env.
   * Default: env flag if set; otherwise rosterIntent === on.
   */
  async seedMissingFromEnv(env: NodeJS.ProcessEnv = process.env): Promise<number> {
    let created = 0;
    for (const entry of listPlatformCronCatalogEntries()) {
      const existing = await this.prisma.schedulerJobPolicy.findUnique({
        where: { jobName: entry.jobName },
        select: { jobName: true },
      });
      if (existing) continue;
      const enabled = resolveSeedEnabled(entry, env);
      await this.prisma.schedulerJobPolicy.create({
        data: { jobName: entry.jobName, enabled, updatedById: null },
      });
      created += 1;
    }
    if (created > 0) {
      this.logger.log(`Seeded ${created} SchedulerJobPolicy row(s) from env/roster`);
    }
    return created;
  }

  async setEnabled(input: {
    jobName: string;
    enabled: boolean;
    actorId: string;
  }): Promise<{ jobName: string; enabled: boolean; previousEnabled: boolean }> {
    const previous = await this.prisma.schedulerJobPolicy.findUnique({
      where: { jobName: input.jobName },
      select: { enabled: true },
    });
    const previousEnabled = previous?.enabled ?? false;
    await this.prisma.schedulerJobPolicy.upsert({
      where: { jobName: input.jobName },
      create: {
        jobName: input.jobName,
        enabled: input.enabled,
        updatedById: input.actorId,
      },
      update: {
        enabled: input.enabled,
        updatedById: input.actorId,
      },
    });
    return {
      jobName: input.jobName,
      enabled: input.enabled,
      previousEnabled,
    };
  }
}

export function resolveSeedEnabled(
  entry: SchedulerJobCatalogEntry,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (entry.enabledEnvKey === null) return false;
  const raw = env[entry.enabledEnvKey];
  if (raw === undefined || raw.trim() === '') {
    return entry.rosterIntent === SCHEDULER_ROSTER_INTENT.on;
  }
  return isEnvFlagEnabled(entry.enabledEnvKey, env);
}
