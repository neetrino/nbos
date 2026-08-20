import { describe, expect, it, vi } from 'vitest';
import { OPS_ALERT_EVENT_BULLMQ_JOB_FAILED } from './ops-job-failure-alert.constants';
import { OpsJobFailureAlertService } from './ops-job-failure-alert.service';

describe('OpsJobFailureAlertService', () => {
  it('notifies Owner and CEO separately on scheduler failure', async () => {
    const createMany = vi.fn().mockResolvedValue({ inserted: 2 });
    const prisma = {
      employee: {
        findMany: vi.fn().mockResolvedValue([{ id: 'owner-1' }, { id: 'ceo-1' }]),
      },
    };
    const service = new OpsJobFailureAlertService(prisma as never, { createMany } as never);
    await service.notifySchedulerRunFailed({
      jobName: 'billing',
      runId: 'run-1',
      status: 'FAILED',
      errorMessage: 'boom',
    });
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientIds: ['owner-1', 'ceo-1'],
        type: 'ops.scheduler_run_failed',
        title: 'Scheduler failed: Monthly billing',
      }),
    );
  });

  it('skips BullMQ alerts until the final attempt', async () => {
    const createMany = vi.fn();
    const prisma = { employee: { findMany: vi.fn() } };
    const service = new OpsJobFailureAlertService(prisma as never, { createMany } as never);
    await service.notifyIfBullmqFinallyFailed(
      'mail',
      { name: 'mail-send', attemptsMade: 1, opts: { attempts: 3 } },
      new Error('temp'),
    );
    expect(createMany).not.toHaveBeenCalled();
  });

  it('publishes a final BullMQ failure and swallows notify errors', async () => {
    const createMany = vi.fn().mockRejectedValue(new Error('inbox down'));
    const prisma = {
      employee: { findMany: vi.fn().mockResolvedValue([{ id: 'owner-1' }]) },
    };
    const service = new OpsJobFailureAlertService(prisma as never, { createMany } as never);
    await expect(
      service.notifyIfBullmqFinallyFailed(
        'mail',
        { name: 'mail-send', attemptsMade: 3, opts: { attempts: 3 } },
        new Error('SMTP down'),
      ),
    ).resolves.toBeUndefined();
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        type: OPS_ALERT_EVENT_BULLMQ_JOB_FAILED,
        recipientIds: ['owner-1'],
      }),
    );
  });
});
