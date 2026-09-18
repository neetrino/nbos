import { describe, expect, it, vi } from 'vitest';
import { MailQueueService } from './mail-queue.service';
import { mailSyncJobId } from './mail-sync-runtime.constants';

type FakeQueue = {
  add: ReturnType<typeof vi.fn>;
  getJob: ReturnType<typeof vi.fn>;
};

function serviceWithQueue(queue: FakeQueue): MailQueueService {
  const service = new MailQueueService();
  Object.assign(service, { queue });
  return service;
}

describe('MailQueueService.enqueueSync', () => {
  it('replaces a completed sync job so the next IDLE/poll enqueue runs', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const add = vi.fn().mockResolvedValue(undefined);
    const getJob = vi.fn().mockResolvedValue({
      getState: vi.fn().mockResolvedValue('completed'),
      remove,
    });
    const service = serviceWithQueue({ add, getJob });

    await expect(service.enqueueSync('acc-1')).resolves.toBe(true);

    expect(getJob).toHaveBeenCalledWith(mailSyncJobId('acc-1'));
    expect(remove).toHaveBeenCalledOnce();
    expect(add).toHaveBeenCalledOnce();
  });

  it('does not queue a second sync while one is in-flight', async () => {
    const remove = vi.fn();
    const add = vi.fn();
    const getJob = vi.fn().mockResolvedValue({
      getState: vi.fn().mockResolvedValue('active'),
      remove,
    });
    const service = serviceWithQueue({ add, getJob });

    await expect(service.enqueueSync('acc-1')).resolves.toBe(true);

    expect(remove).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });
});
