import { afterEach, describe, expect, it, vi } from 'vitest';
import { SchedulerOccurrenceService } from './scheduler-occurrence.service';
import type { SchedulerExecutionQueueService } from './scheduler-execution-queue.service';

type StoredOccurrence = {
  id: string;
  jobName: string;
  scheduledFor: Date;
  trigger: string;
  status: string;
  attemptCount: number;
  startedAt: Date | null;
};

function occurrenceStore() {
  const rows = new Map<string, StoredOccurrence>();
  const prisma = {
    schedulerOccurrence: {
      create: vi.fn(async ({ data }: { data: StoredOccurrence }) => {
        const key = `${data.jobName}|${new Date(data.scheduledFor).toISOString()}`;
        if (rows.has(key)) throw Object.assign(new Error('unique'), { code: 'P2002' });
        const row = { ...data, id: `occ-${rows.size + 1}`, attemptCount: 0, startedAt: null };
        rows.set(key, row);
        return row;
      }),
      findUniqueOrThrow: vi.fn(
        async ({
          where,
        }: {
          where: { jobName_scheduledFor: { jobName: string; scheduledFor: Date } };
        }) => {
          const slot = where.jobName_scheduledFor;
          const key = `${slot.jobName}|${slot.scheduledFor.toISOString()}`;
          const row = rows.get(key);
          if (!row) throw new Error('missing');
          return row;
        },
      ),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  return { prisma, rows };
}

describe('SchedulerOccurrenceService durability', () => {
  const services: SchedulerOccurrenceService[] = [];

  afterEach(() => {
    for (const service of services) service.onModuleDestroy();
    services.length = 0;
  });

  it('keeps one occurrence when two replicas tick the same slot', async () => {
    const { prisma, rows } = occurrenceStore();
    const queue = { enqueue: vi.fn().mockRejectedValue(new Error('redis_down')) };
    const service = new SchedulerOccurrenceService(
      prisma as never,
      queue as unknown as SchedulerExecutionQueueService,
    );
    services.push(service);
    const tick = { jobName: 'invoice-card-reminders', expression: '0 11 * * *' };
    const first = await service.enqueueCron(tick);
    const second = await service.enqueueCron(tick);
    expect(second.id).toBe(first.id);
    expect(rows.size).toBe(1);
    expect(first.status).toBe('PENDING');
    expect(prisma.schedulerOccurrence.updateMany).not.toHaveBeenCalled();
  });

  it('leaves the occurrence pending when enqueue fails', async () => {
    const { prisma } = occurrenceStore();
    const queue = { enqueue: vi.fn().mockRejectedValue(new Error('redis_down')) };
    const service = new SchedulerOccurrenceService(
      prisma as never,
      queue as unknown as SchedulerExecutionQueueService,
    );
    services.push(service);
    const row = await service.enqueueCron({
      jobName: 'invoice-card-reminders',
      expression: '0 11 * * *',
    });
    expect(queue.enqueue).toHaveBeenCalledOnce();
    expect(row.status).toBe('PENDING');
  });
});
