import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailComposeService } from './mail-compose.service';

describe('MailComposeService.dispatch contour', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('enqueues and does not send inline when the queue accepts the job', async () => {
    const enqueueSend = vi.fn().mockResolvedValue(true);
    const sendQueuedMessage = vi.fn();
    const service = new MailComposeService(
      {} as never,
      { sendQueuedMessage } as never,
      { enqueueSend } as never,
    );
    await (
      service as unknown as {
        dispatch: (threadId: string, messageId: string, accountId: string, employeeId: string) => Promise<void>;
      }
    ).dispatch('t1', 'm1', 'a1', 'e1');
    expect(enqueueSend).toHaveBeenCalledWith({
      mailAccountId: 'a1',
      messageId: 'm1',
      actorEmployeeId: 'e1',
    });
    expect(sendQueuedMessage).not.toHaveBeenCalled();
  });

  it('throws 503 in production when enqueue fails', async () => {
    process.env.NODE_ENV = 'production';
    const service = new MailComposeService(
      {} as never,
      { sendQueuedMessage: vi.fn() } as never,
      { enqueueSend: vi.fn().mockResolvedValue(false) } as never,
    );
    await expect(
      (
        service as unknown as {
          dispatch: (threadId: string, messageId: string, accountId: string, employeeId: string) => Promise<void>;
        }
      ).dispatch('t1', 'm1', 'a1', 'e1'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
