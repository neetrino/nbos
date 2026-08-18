import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAIL_INLINE_FALLBACK_LOG } from './mail-outbound-runtime.constants';
import { dispatchQueuedOutboundSend } from './mail-outbound-dispatch';

describe('dispatchQueuedOutboundSend', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('does not send inline when enqueue is accepted', async () => {
    const sendQueuedMessage = vi.fn();
    await dispatchQueuedOutboundSend({
      queue: { enqueueSend: vi.fn().mockResolvedValue(true) } as never,
      sendService: { sendQueuedMessage } as never,
      logger: { warn: vi.fn() } as unknown as Logger,
      mailAccountId: 'a1',
      messageId: 'm1',
      actorEmployeeId: 'e1',
    });
    expect(sendQueuedMessage).not.toHaveBeenCalled();
  });

  it('returns 503 and does not send in production when enqueue fails', async () => {
    process.env.NODE_ENV = 'production';
    const sendQueuedMessage = vi.fn();
    await expect(
      dispatchQueuedOutboundSend({
        queue: { enqueueSend: vi.fn().mockResolvedValue(false) } as never,
        sendService: { sendQueuedMessage } as never,
        logger: { warn: vi.fn() } as unknown as Logger,
        mailAccountId: 'a1',
        messageId: 'm1',
        actorEmployeeId: 'e1',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(sendQueuedMessage).not.toHaveBeenCalled();
  });

  it('uses inline fallback outside production and logs mail.inline_fallback', async () => {
    process.env.NODE_ENV = 'development';
    const sendQueuedMessage = vi.fn();
    const warn = vi.fn();
    await dispatchQueuedOutboundSend({
      queue: { enqueueSend: vi.fn().mockResolvedValue(false) } as never,
      sendService: { sendQueuedMessage } as never,
      logger: { warn } as unknown as Logger,
      mailAccountId: 'a1',
      messageId: 'm1',
      actorEmployeeId: 'e1',
    });
    expect(sendQueuedMessage).toHaveBeenCalledWith('a1', 'm1', 'e1');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(MAIL_INLINE_FALLBACK_LOG));
  });
});
