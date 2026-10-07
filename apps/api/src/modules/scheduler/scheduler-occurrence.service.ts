import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { registerSchedulerCronDispatch, type SchedulerCronTick } from './scheduler-cron-dispatch';
import {
  SCHEDULER_OCCURRENCE_STATUS,
  schedulerExecutionJobId,
  type SchedulerOccurrenceStatus,
} from './scheduler-occurrence.constants';
import { SchedulerExecutionQueueService } from './scheduler-execution-queue.service';
import type { SchedulerTrigger } from './scheduler-lease.constants';
import { resolveSchedulerSlot } from './scheduler-slot';

const MANUAL_SLOT_ATTEMPTS = 5;
const ERROR_MAX = 500;

export type SchedulerOccurrenceRow = {
  id: string;
  jobName: string;
  scheduledFor: Date;
  trigger: string;
  status: string;
  attemptCount: number;
  startedAt: Date | null;
};

type EnsureResult = { row: SchedulerOccurrenceRow; created: boolean };

@Injectable()
export class SchedulerOccurrenceService implements OnModuleDestroy {
  private readonly logger = new Logger(SchedulerOccurrenceService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly queue: SchedulerExecutionQueueService,
  ) {
    registerSchedulerCronDispatch(async (tick) => {
      await this.enqueueCron(tick);
    });
  }

  onModuleDestroy(): void {
    registerSchedulerCronDispatch(null);
  }

  async enqueueCron(tick: SchedulerCronTick): Promise<SchedulerOccurrenceRow> {
    const scheduledFor = resolveSchedulerSlot(tick.expression, new Date());
    const ensured = await this.ensure(tick.jobName, scheduledFor, 'cron');
    this.logEnsured(ensured, 'cron');
    await this.tryQueue(ensured.row);
    return ensured.row;
  }

  async enqueueManual(input: {
    jobName: string;
    trigger: SchedulerTrigger;
  }): Promise<SchedulerOccurrenceRow> {
    const ensured = await this.ensureManualSlot(input.jobName, input.trigger);
    this.logEnsured(ensured, input.trigger);
    await this.tryQueue(ensured.row);
    return ensured.row;
  }

  async claimRunning(id: string): Promise<boolean> {
    const updated = await this.prisma.schedulerOccurrence.updateMany({
      where: {
        id,
        status: {
          in: [SCHEDULER_OCCURRENCE_STATUS.PENDING, SCHEDULER_OCCURRENCE_STATUS.QUEUED],
        },
      },
      data: {
        status: SCHEDULER_OCCURRENCE_STATUS.RUNNING,
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    if (updated.count === 1) {
      this.logger.log(`scheduler_occurrence_started occurrenceId=${id}`);
    }
    return updated.count === 1;
  }

  async markQueued(id: string, jobName: string, scheduledFor: Date): Promise<void> {
    const updated = await this.prisma.schedulerOccurrence.updateMany({
      where: {
        id,
        status: {
          in: [SCHEDULER_OCCURRENCE_STATUS.PENDING, SCHEDULER_OCCURRENCE_STATUS.QUEUED],
        },
      },
      data: {
        status: SCHEDULER_OCCURRENCE_STATUS.QUEUED,
        queuedAt: new Date(),
        queueJobId: schedulerExecutionJobId(jobName, scheduledFor),
        lastError: null,
      },
    });
    if (updated.count === 1) {
      this.logger.log(`scheduler_occurrence_queued occurrenceId=${id} jobName=${jobName}`);
    }
  }

  async markSucceeded(id: string): Promise<void> {
    await this.transition(id, SCHEDULER_OCCURRENCE_STATUS.SUCCEEDED, { finishedAt: new Date() });
    this.logger.log(`scheduler_occurrence_succeeded occurrenceId=${id}`);
  }

  async markFailed(id: string, error: unknown): Promise<void> {
    const lastError = readError(error);
    await this.transition(id, SCHEDULER_OCCURRENCE_STATUS.FAILED, {
      finishedAt: new Date(),
      lastError,
    });
    this.logger.warn(`scheduler_occurrence_failed occurrenceId=${id} error=${lastError}`);
  }

  async releaseToQueue(id: string, jobName: string, scheduledFor: Date): Promise<void> {
    await this.prisma.schedulerOccurrence.updateMany({
      where: { id, status: SCHEDULER_OCCURRENCE_STATUS.RUNNING },
      data: {
        status: SCHEDULER_OCCURRENCE_STATUS.QUEUED,
        queueJobId: schedulerExecutionJobId(jobName, scheduledFor),
        lastError: 'SKIPPED_ALREADY_RUNNING',
      },
    });
    this.logger.warn(
      `scheduler_occurrence_deferred occurrenceId=${id} jobName=${jobName} reason=SKIPPED_ALREADY_RUNNING`,
    );
  }

  async markPending(id: string): Promise<void> {
    await this.prisma.schedulerOccurrence.updateMany({
      where: {
        id,
        status: {
          in: [SCHEDULER_OCCURRENCE_STATUS.QUEUED, SCHEDULER_OCCURRENCE_STATUS.RUNNING],
        },
      },
      data: { status: SCHEDULER_OCCURRENCE_STATUS.PENDING, lastError: null },
    });
    this.logger.warn(`scheduler_occurrence_recovered occurrenceId=${id}`);
  }

  async readStatus(id: string): Promise<string | null> {
    const row = await this.prisma.schedulerOccurrence.findUnique({
      where: { id },
      select: { status: true },
    });
    return row?.status ?? null;
  }

  async listRecoverable(limit: number): Promise<SchedulerOccurrenceRow[]> {
    return this.prisma.schedulerOccurrence.findMany({
      where: {
        status: {
          in: [
            SCHEDULER_OCCURRENCE_STATUS.PENDING,
            SCHEDULER_OCCURRENCE_STATUS.QUEUED,
            SCHEDULER_OCCURRENCE_STATUS.RUNNING,
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: occurrenceSelect,
    });
  }

  async tryQueue(row: SchedulerOccurrenceRow): Promise<void> {
    if (!isQueueable(row.status)) return;
    try {
      const result = await this.queue.enqueue({
        occurrenceId: row.id,
        jobName: row.jobName,
        trigger: row.trigger as SchedulerTrigger,
        scheduledFor: row.scheduledFor.toISOString(),
      });
      if (result === 'completed') {
        await this.markSucceeded(row.id);
        return;
      }
      await this.markQueued(row.id, row.jobName, row.scheduledFor);
    } catch (caught) {
      this.logger.warn(
        `scheduler_occurrence_enqueue_failed occurrenceId=${row.id} jobName=${row.jobName} error=${readError(caught)}`,
      );
    }
  }

  private async ensure(
    jobName: string,
    scheduledFor: Date,
    trigger: SchedulerTrigger,
  ): Promise<EnsureResult> {
    try {
      const row = await this.prisma.schedulerOccurrence.create({
        data: { jobName, scheduledFor, trigger, status: SCHEDULER_OCCURRENCE_STATUS.PENDING },
        select: occurrenceSelect,
      });
      return { row, created: true };
    } catch (caught) {
      if (!isUniqueConflict(caught)) throw caught;
      const row = await this.prisma.schedulerOccurrence.findUniqueOrThrow({
        where: { jobName_scheduledFor: { jobName, scheduledFor } },
        select: occurrenceSelect,
      });
      return { row, created: false };
    }
  }

  private async ensureManualSlot(
    jobName: string,
    trigger: SchedulerTrigger,
  ): Promise<EnsureResult> {
    for (let offset = 0; offset < MANUAL_SLOT_ATTEMPTS; offset += 1) {
      const scheduledFor = new Date(Date.now() + offset);
      try {
        const row = await this.prisma.schedulerOccurrence.create({
          data: { jobName, scheduledFor, trigger, status: SCHEDULER_OCCURRENCE_STATUS.PENDING },
          select: occurrenceSelect,
        });
        return { row, created: true };
      } catch (caught) {
        if (!isUniqueConflict(caught)) throw caught;
      }
    }
    throw new Error(`Could not allocate a manual occurrence for ${jobName}`);
  }

  private async transition(
    id: string,
    status: SchedulerOccurrenceStatus,
    data: { queuedAt?: Date; queueJobId?: string; finishedAt?: Date; lastError?: string | null },
  ): Promise<void> {
    await this.prisma.schedulerOccurrence.updateMany({
      where: {
        id,
        status: {
          notIn: [SCHEDULER_OCCURRENCE_STATUS.SUCCEEDED, SCHEDULER_OCCURRENCE_STATUS.CANCELLED],
        },
      },
      data: { status, ...data },
    });
  }

  private logEnsured(ensured: EnsureResult, trigger: string): void {
    const event = ensured.created
      ? 'scheduler_occurrence_created'
      : 'scheduler_occurrence_existing';
    this.logger.log(
      `${event} occurrenceId=${ensured.row.id} jobName=${ensured.row.jobName} trigger=${trigger} scheduledFor=${ensured.row.scheduledFor.toISOString()} status=${ensured.row.status}`,
    );
  }
}

const occurrenceSelect = {
  id: true,
  jobName: true,
  scheduledFor: true,
  trigger: true,
  status: true,
  attemptCount: true,
  startedAt: true,
} as const;

function isQueueable(status: string): boolean {
  return (
    status === SCHEDULER_OCCURRENCE_STATUS.PENDING || status === SCHEDULER_OCCURRENCE_STATUS.QUEUED
  );
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function readError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'scheduler_occurrence_error';
  return message.slice(0, ERROR_MAX);
}
