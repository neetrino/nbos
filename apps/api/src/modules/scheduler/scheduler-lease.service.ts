import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  SCHEDULER_RUN_STATUS,
  type SchedulerRunStatus,
  type SchedulerTrigger,
  assertSchedulerLeaseTiming,
} from './scheduler-lease.constants';
import { resolveDbPoolRuntimeConfig } from '@nbos/database';
import { SchedulerRunService } from './scheduler-run.service';

export type LeaseHandle = {
  jobName: string;
  ownerId: string;
  fencingToken: bigint;
  leaseUntil: Date;
};

export type RunWithLeaseOptions = {
  jobName: string;
  trigger: SchedulerTrigger;
  ttlMs?: number;
  heartbeatIntervalMs?: number;
  ownerId?: string;
};

export type LeaseHandlerContext = {
  signal: AbortSignal;
  fencingToken: bigint;
  ownerId: string;
  runId: string;
};

export type LeaseHandlerResult = {
  processedCount?: number;
  metadata?: Record<string, unknown>;
};

type LeaseRow = {
  job_name: string;
  owner_id: string;
  lease_until: Date;
  heartbeat_at: Date;
  fencing_token: bigint;
};

@Injectable()
export class SchedulerLeaseService {
  private readonly logger = new Logger(SchedulerLeaseService.name);
  private activeRuns = 0;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly runs: SchedulerRunService,
  ) {}

  /**
   * Atomic acquire: insert or take over expired lease; bump fencingToken on new ownership.
   */
  async acquire(jobName: string, ownerId: string, ttlMs: number): Promise<LeaseHandle | null> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + ttlMs);
    const rows = await this.prisma.$queryRaw<LeaseRow[]>`
      INSERT INTO "scheduler_leases" (
        "job_name", "owner_id", "lease_until", "heartbeat_at", "fencing_token", "created_at", "updated_at"
      )
      VALUES (
        ${jobName}, ${ownerId}, ${leaseUntil}, ${now}, 1, ${now}, ${now}
      )
      ON CONFLICT ("job_name") DO UPDATE
      SET
        "owner_id" = EXCLUDED."owner_id",
        "lease_until" = EXCLUDED."lease_until",
        "heartbeat_at" = EXCLUDED."heartbeat_at",
        "fencing_token" = "scheduler_leases"."fencing_token" + 1,
        "updated_at" = EXCLUDED."updated_at"
      WHERE "scheduler_leases"."lease_until" < ${now}
      RETURNING
        "job_name", "owner_id", "lease_until", "heartbeat_at", "fencing_token"
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      jobName: row.job_name,
      ownerId: row.owner_id,
      fencingToken: BigInt(row.fencing_token),
      leaseUntil: row.lease_until,
    };
  }

  async heartbeat(
    jobName: string,
    ownerId: string,
    fencingToken: bigint,
    ttlMs: number,
  ): Promise<boolean> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + ttlMs);
    const updated = await this.prisma.$executeRaw`
      UPDATE "scheduler_leases"
      SET
        "lease_until" = ${leaseUntil},
        "heartbeat_at" = ${now},
        "updated_at" = ${now}
      WHERE "job_name" = ${jobName}
        AND "owner_id" = ${ownerId}
        AND "fencing_token" = ${fencingToken}
    `;
    return updated === 1;
  }

  async release(jobName: string, ownerId: string, fencingToken: bigint): Promise<boolean> {
    const now = new Date();
    const updated = await this.prisma.$executeRaw`
      UPDATE "scheduler_leases"
      SET
        "lease_until" = ${now},
        "heartbeat_at" = ${now},
        "updated_at" = ${now}
      WHERE "job_name" = ${jobName}
        AND "owner_id" = ${ownerId}
        AND "fencing_token" = ${fencingToken}
    `;
    return updated === 1;
  }

  async runWithLease(
    options: RunWithLeaseOptions,
    handler: (ctx: LeaseHandlerContext) => Promise<LeaseHandlerResult | void>,
  ): Promise<{ status: SchedulerRunStatus; runId: string | null }> {
    const maxConcurrent = resolveDbPoolRuntimeConfig().schedulerMaxConcurrentRuns;
    if (this.activeRuns >= maxConcurrent) {
      this.logger.warn(
        `Scheduler backpressure: activeRuns=${this.activeRuns} max=${maxConcurrent} job=${options.jobName}`,
      );
      const skipped = await this.runs.create({
        jobName: options.jobName,
        ownerId: options.ownerId ?? `${process.pid}:backpressure`,
        fencingToken: 0n,
        trigger: options.trigger,
        status: SCHEDULER_RUN_STATUS.SKIPPED_LOCKED,
        startedAt: new Date(),
        finishedAt: new Date(),
        durationMs: 0,
      });
      return { status: SCHEDULER_RUN_STATUS.SKIPPED_LOCKED, runId: skipped.id };
    }
    this.activeRuns += 1;
    try {
      return await this.runWithLeaseInner(options, handler);
    } finally {
      this.activeRuns = Math.max(0, this.activeRuns - 1);
    }
  }

  private async runWithLeaseInner(
    options: RunWithLeaseOptions,
    handler: (ctx: LeaseHandlerContext) => Promise<LeaseHandlerResult | void>,
  ): Promise<{ status: SchedulerRunStatus; runId: string | null }> {
    const timing = assertSchedulerLeaseTiming();
    const ttlMs = options.ttlMs ?? timing.leaseTtlMs;
    const heartbeatIntervalMs = options.heartbeatIntervalMs ?? timing.heartbeatIntervalMs;
    const ownerId = options.ownerId ?? `${process.pid}:${randomUUID()}`;
    const startedAt = new Date();

    const lease = await this.acquire(options.jobName, ownerId, ttlMs);
    if (!lease) {
      const skipped = await this.runs.create({
        jobName: options.jobName,
        ownerId,
        fencingToken: 0n,
        trigger: options.trigger,
        status: SCHEDULER_RUN_STATUS.SKIPPED_LOCKED,
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
      });
      this.logger.log(
        `jobName=${options.jobName} status=SKIPPED_LOCKED trigger=${options.trigger} runId=${skipped.id}`,
      );
      return { status: SCHEDULER_RUN_STATUS.SKIPPED_LOCKED, runId: skipped.id };
    }

    const run = await this.runs.create({
      jobName: options.jobName,
      ownerId: lease.ownerId,
      fencingToken: lease.fencingToken,
      trigger: options.trigger,
      status: SCHEDULER_RUN_STATUS.RUNNING,
      startedAt,
      heartbeatAt: startedAt,
    });

    const abort = new AbortController();
    let lostLease = false;
    const heartbeatTimer = setInterval(() => {
      void (async () => {
        const ok = await this.heartbeat(lease.jobName, lease.ownerId, lease.fencingToken, ttlMs);
        if (!ok) {
          lostLease = true;
          abort.abort();
          this.logger.error(
            `Lost lease ownership jobName=${lease.jobName} fencingToken=${lease.fencingToken.toString()}`,
          );
        } else {
          await this.runs.touchHeartbeat(run.id, new Date());
        }
      })();
    }, heartbeatIntervalMs);

    let status: SchedulerRunStatus = SCHEDULER_RUN_STATUS.SUCCEEDED;
    let errorCode: string | undefined;
    let errorMessage: string | undefined;
    let processedCount: number | undefined;
    let metadata: Record<string, unknown> | undefined;

    try {
      const result = await handler({
        signal: abort.signal,
        fencingToken: lease.fencingToken,
        ownerId: lease.ownerId,
        runId: run.id,
      });
      if (abort.signal.aborted || lostLease) {
        status = SCHEDULER_RUN_STATUS.TIMED_OUT;
        errorCode = 'LEASE_LOST';
        errorMessage = 'Lease heartbeat failed or aborted';
      } else {
        processedCount = result?.processedCount;
        metadata = result?.metadata;
      }
    } catch (caught) {
      status = SCHEDULER_RUN_STATUS.FAILED;
      errorCode = caught instanceof Error ? caught.name : 'Error';
      errorMessage =
        caught instanceof Error ? caught.message.slice(0, 500) : String(caught).slice(0, 500);
    } finally {
      clearInterval(heartbeatTimer);
      const finishedAt = new Date();
      await this.runs.finish(run.id, {
        status,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        processedCount,
        errorCode,
        errorMessage,
        metadata,
      });
      await this.release(lease.jobName, lease.ownerId, lease.fencingToken).catch(() => undefined);
      this.logger.log(
        `jobName=${options.jobName} runId=${run.id} ownerId=${lease.ownerId} fencingToken=${lease.fencingToken.toString()} trigger=${options.trigger} status=${status} durationMs=${finishedAtDelta(startedAt)} processedCount=${processedCount ?? ''}`,
      );
    }

    return { status, runId: run.id };
  }
}

function finishedAtDelta(startedAt: Date): number {
  return Date.now() - startedAt.getTime();
}
