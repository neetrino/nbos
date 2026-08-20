import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import {
  listPlatformCronCatalogEntries,
  type SchedulerJobCatalogEntry,
} from './scheduler-job-catalog';
import {
  DEFAULT_SCHEDULER_RUNTIME_SNAPSHOT_INTERVAL_MS,
  isSchedulerEnabled,
} from './scheduler-lease.constants';
import { SchedulerJobPolicyService } from './scheduler-job-policy.service';

@Injectable()
export class SchedulerJobRuntimeSnapshotService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerJobRuntimeSnapshotService.name);
  private readonly ownerId = `${hostname()}:${process.pid}`;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: ConfigService,
    private readonly jobRegistry: ScheduledJobRegistry,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly policyService: SchedulerJobPolicyService,
  ) {}

  onApplicationBootstrap(): void {
    void this.bootstrapSnapshot().catch((caught: unknown) => {
      this.logger.error('Initial SchedulerJobRuntime snapshot failed', caught);
    });
    this.intervalHandle = setInterval(() => {
      void this.writeSnapshot().catch((caught: unknown) => {
        this.logger.error('SchedulerJobRuntime snapshot failed', caught);
      });
    }, DEFAULT_SCHEDULER_RUNTIME_SNAPSHOT_INTERVAL_MS);
    this.intervalHandle.unref?.();
  }

  onModuleDestroy(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async bootstrapSnapshot(): Promise<void> {
    await this.policyService.seedMissingFromEnv();
    await this.writeSnapshot();
  }

  async writeSnapshot(): Promise<void> {
    const masterEnabled = isSchedulerEnabled();
    const timezone = process.env.TZ?.trim() || 'UTC';
    const heartbeatAt = new Date();
    const registeredNames = new Set(this.jobRegistry.list());
    const nestCronNames = this.listNestCronNames();
    const policies = await this.policyService.listByJobNames(
      listPlatformCronCatalogEntries().map((entry) => entry.jobName),
    );

    for (const entry of listPlatformCronCatalogEntries()) {
      const policy = policies.get(entry.jobName);
      const policyEnabled = policy?.enabled === true;
      const registered = registeredNames.has(entry.jobName) || nestCronNames.has(entry.jobName);
      const expression = this.resolveExpression(entry);

      await this.prisma.schedulerJobRuntime.upsert({
        where: { jobName: entry.jobName },
        create: {
          jobName: entry.jobName,
          masterEnabled,
          registered,
          enabledByEnv: policyEnabled,
          expression,
          timezone,
          heartbeatAt,
          schedulerOwnerId: this.ownerId,
        },
        update: {
          masterEnabled,
          registered,
          enabledByEnv: policyEnabled,
          expression,
          timezone,
          heartbeatAt,
          schedulerOwnerId: this.ownerId,
        },
      });
    }
  }

  private resolveExpression(entry: SchedulerJobCatalogEntry): string | null {
    if (entry.cronEnvKey === null) return entry.defaultExpression;
    const raw = this.config.get(entry.cronEnvKey);
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
    return entry.defaultExpression;
  }

  private listNestCronNames(): Set<string> {
    try {
      return new Set([...this.schedulerRegistry.getCronJobs().keys()]);
    } catch {
      return new Set();
    }
  }
}
