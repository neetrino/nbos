import { hostname } from 'node:os';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { shouldRegisterScheduledJobs } from '../../runtime/process-role';
import { SchedulerLeaseService } from './scheduler-lease.service';
import { assertSchedulerLeaseTiming } from './scheduler-lease.constants';
import {
  SCHEDULER_OCCURRENCE_RECONCILE_BATCH,
  SCHEDULER_OCCURRENCE_RECONCILE_INTERVAL_MS,
  SCHEDULER_OCCURRENCE_RECONCILE_LEASE,
  SCHEDULER_OCCURRENCE_STATUS,
  SCHEDULER_RUNNING_STALE_MULTIPLIER,
} from './scheduler-occurrence.constants';
import { planOccurrenceReconcile } from './scheduler-occurrence.policy';
import {
  SchedulerOccurrenceService,
  type SchedulerOccurrenceRow,
} from './scheduler-occurrence.service';
import { SchedulerExecutionQueueService } from './scheduler-execution-queue.service';

@Injectable()
export class SchedulerOccurrenceReconcileService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerOccurrenceReconcileService.name);
  private readonly ownerId = `${hostname()}:${process.pid}:occurrence-reconcile`;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly occurrences: SchedulerOccurrenceService,
    private readonly queue: SchedulerExecutionQueueService,
    private readonly lease: SchedulerLeaseService,
  ) {}

  onModuleInit(): void {
    if (!shouldRegisterScheduledJobs()) return;
    this.timer = setInterval(() => {
      void this.tick().catch((caught: unknown) => {
        this.logger.error('scheduler_occurrence_reconcile_failed', caught);
      });
    }, SCHEDULER_OCCURRENCE_RECONCILE_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(now = new Date()): Promise<void> {
    const timing = assertSchedulerLeaseTiming();
    const handle = await this.lease.acquire(
      SCHEDULER_OCCURRENCE_RECONCILE_LEASE,
      this.ownerId,
      timing.leaseTtlMs,
    );
    if (!handle) return;
    try {
      await this.reconcileBatch(now, timing.leaseTtlMs);
    } finally {
      await this.lease.release(handle.jobName, handle.ownerId, handle.fencingToken);
    }
  }

  private async reconcileBatch(now: Date, leaseTtlMs: number): Promise<void> {
    const rows = await this.occurrences.listRecoverable(SCHEDULER_OCCURRENCE_RECONCILE_BATCH);
    for (const row of rows) {
      await this.reconcileOne(row, now, leaseTtlMs);
    }
    if (rows.length > 0) {
      this.logger.log(`scheduler_occurrence_reconcile scanned=${rows.length}`);
    }
  }

  private async reconcileOne(
    row: SchedulerOccurrenceRow,
    now: Date,
    leaseTtlMs: number,
  ): Promise<void> {
    const queueState = await this.queue.describe(row.jobName, row.scheduledFor);
    const plan = planOccurrenceReconcile({
      status: row.status,
      queueState,
      runningStale: isRunningStale(row, now, leaseTtlMs),
    });
    if (plan === 'reset_enqueue') await this.occurrences.markPending(row.id);
    if (plan === 'enqueue' || plan === 'reset_enqueue') {
      await this.occurrences.tryQueue({ ...row, status: SCHEDULER_OCCURRENCE_STATUS.PENDING });
    }
    if (plan === 'mark_succeeded') await this.occurrences.markSucceeded(row.id);
    if (plan !== 'wait') {
      this.logger.log(
        `scheduler_occurrence_reconcile occurrenceId=${row.id} jobName=${row.jobName} plan=${plan}`,
      );
    }
  }
}

function isRunningStale(row: SchedulerOccurrenceRow, now: Date, leaseTtlMs: number): boolean {
  if (row.status !== SCHEDULER_OCCURRENCE_STATUS.RUNNING) return false;
  if (!row.startedAt) return true;
  return now.getTime() - row.startedAt.getTime() > leaseTtlMs * SCHEDULER_RUNNING_STALE_MULTIPLIER;
}
