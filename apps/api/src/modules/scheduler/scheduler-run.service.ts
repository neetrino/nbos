import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { SchedulerRunStatus, SchedulerTrigger } from './scheduler-lease.constants';

@Injectable()
export class SchedulerRunService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async create(input: {
    jobName: string;
    ownerId: string;
    fencingToken: bigint;
    trigger: SchedulerTrigger;
    status: SchedulerRunStatus;
    startedAt: Date;
    finishedAt?: Date;
    durationMs?: number;
    heartbeatAt?: Date;
  }) {
    return this.prisma.schedulerRun.create({
      data: {
        id: randomUUID(),
        jobName: input.jobName,
        ownerId: input.ownerId,
        fencingToken: input.fencingToken,
        trigger: input.trigger,
        status: input.status,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
        durationMs: input.durationMs,
        heartbeatAt: input.heartbeatAt,
      },
    });
  }

  async touchHeartbeat(runId: string, heartbeatAt: Date): Promise<void> {
    await this.prisma.schedulerRun.update({
      where: { id: runId },
      data: { heartbeatAt },
    });
  }

  async finish(
    runId: string,
    input: {
      status: SchedulerRunStatus;
      finishedAt: Date;
      durationMs: number;
      processedCount?: number;
      errorCode?: string;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.prisma.schedulerRun.update({
      where: { id: runId },
      data: {
        status: input.status,
        finishedAt: input.finishedAt,
        durationMs: input.durationMs,
        processedCount: input.processedCount,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        metadata: input.metadata === undefined ? undefined : (input.metadata as InputJsonValue),
      },
    });
  }

  async listRecent(limit = 50) {
    return this.prisma.schedulerRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  async listByJob(jobName: string, limit = 20) {
    return this.prisma.schedulerRun.findMany({
      where: { jobName },
      orderBy: { startedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }
}
