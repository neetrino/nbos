import { describe, expect, it, vi } from 'vitest';
import { DelayedError } from 'bullmq';
import type { Job } from 'bullmq';
import { SchedulerExecutionWorker } from './scheduler-execution.worker';
import { SchedulerOccurrenceReconcileService } from './scheduler-occurrence-reconcile.service';
import type { SchedulerExecutionPayload } from './scheduler-execution-queue.service';

describe('scheduler execution recovery', () => {
  it('delays a lease collision instead of finishing the occurrence', async () => {
    const releaseToQueue = vi.fn();
    const markSucceeded = vi.fn();
    const worker = new SchedulerExecutionWorker(
      {
        claimRunning: vi.fn().mockResolvedValue(true),
        releaseToQueue,
        markSucceeded,
        markFailed: vi.fn(),
        markPending: vi.fn(),
      } as never,
      {
        runInvoiceCardReminders: vi.fn().mockResolvedValue({ status: 'SKIPPED_LOCKED' }),
      } as never,
      {} as never,
    );
    const job = {
      data: {
        occurrenceId: 'occ-1',
        jobName: 'invoice-card-reminders',
        trigger: 'cron',
        scheduledFor: '2026-10-07T07:00:00.000Z',
      },
      opts: { attempts: 5 },
      attemptsMade: 0,
      moveToDelayed: vi.fn(),
    };
    await expect(
      worker.execute(job as unknown as Job<SchedulerExecutionPayload>, 'token'),
    ).rejects.toBeInstanceOf(DelayedError);
    expect(releaseToQueue).toHaveBeenCalledWith(
      'occ-1',
      'invoice-card-reminders',
      new Date('2026-10-07T07:00:00.000Z'),
    );
    expect(markSucceeded).not.toHaveBeenCalled();
    expect(job.moveToDelayed).toHaveBeenCalledWith(expect.any(Number), 'token');
  });

  it('enqueues a pending occurrence again after Redis recovers', async () => {
    const tryQueue = vi.fn();
    const reconcile = new SchedulerOccurrenceReconcileService(
      {
        listRecoverable: vi.fn().mockResolvedValue([
          {
            id: 'occ-1',
            jobName: 'invoice-card-reminders',
            scheduledFor: new Date('2026-10-07T07:00:00.000Z'),
            trigger: 'cron',
            status: 'PENDING',
            attemptCount: 0,
            startedAt: null,
          },
        ]),
        tryQueue,
        markPending: vi.fn(),
        markSucceeded: vi.fn(),
      } as never,
      { describe: vi.fn().mockResolvedValue('missing') } as never,
      {
        acquire: vi.fn().mockResolvedValue({
          jobName: 'scheduler-occurrence-reconcile',
          ownerId: 'owner',
          fencingToken: 1n,
        }),
        release: vi.fn().mockResolvedValue(true),
      } as never,
    );
    await reconcile.tick();
    expect(tryQueue).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'occ-1', status: 'PENDING' }),
    );
  });
});
