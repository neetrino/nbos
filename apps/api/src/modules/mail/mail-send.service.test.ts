import { describe, expect, it, vi } from 'vitest';
import { MailAmbiguousSendError } from './mail-provider-error.classify';
import { MailSendService } from './mail-send.service';

function baseMessage(deliveryStatus: string, providerMessageId: string | null = null) {
  return {
    id: 'm1',
    mailAccountId: 'a1',
    direction: 'OUTBOUND',
    deliveryStatus,
    providerMessageId,
    subject: 'Hi',
    bodyText: 'body',
    bodyHtmlSanitized: null,
    recipients: [{ kind: 'TO', email: 'to@x.com' }],
    thread: { providerThreadId: null },
    threadId: 't1',
  };
}

function createService(options: {
  message: ReturnType<typeof baseMessage>;
  claimCount?: number;
  sendMessage?: ReturnType<typeof vi.fn>;
}) {
  const sendMessage =
    options.sendMessage ??
    vi.fn().mockResolvedValue({ providerMessageId: 'p1', messageIdHeader: '<id>' });
  const prisma = {
    emailMessage: {
      findUnique: vi.fn().mockResolvedValue(options.message),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ threadId: 't1' }),
      updateMany: vi.fn().mockResolvedValue({ count: options.claimCount ?? 1 }),
    },
    emailThread: { update: vi.fn() },
    mailAccount: {
      findUnique: vi.fn().mockResolvedValue({
        emailAddress: 'from@x.com',
        displayName: 'From',
        providerType: 'GMAIL',
        providerConnection: {
          username: null,
          imapHost: null,
          imapPort: null,
          secureMode: null,
          smtpHost: null,
          smtpPort: null,
          smtpSecureMode: null,
        },
      }),
    },
    emailAttachment: { findMany: vi.fn().mockResolvedValue([]) },
    mailDeliveryLog: { create: vi.fn() },
  };
  const adapterFactory = { forConnection: vi.fn().mockResolvedValue({ sendMessage }) };
  const service = new MailSendService(
    prisma as never,
    adapterFactory as never,
    { log: vi.fn() } as never,
    { bucket: 'b', ensureS3: vi.fn() } as never,
  );
  return { service, sendMessage, prisma, adapterFactory };
}

describe('MailSendService.sendQueuedMessage', () => {
  it('does not call the provider when already SENT', async () => {
    const { service, sendMessage, adapterFactory } = createService({
      message: baseMessage('SENT', 'p1'),
    });
    await service.sendQueuedMessage('a1', 'm1', 'e1');
    expect(adapterFactory.forConnection).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not call the provider when the QUEUED claim loses', async () => {
    const { service, sendMessage } = createService({
      message: baseMessage('QUEUED'),
      claimCount: 0,
    });
    await service.sendQueuedMessage('a1', 'm1', 'e1');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('sends once after a successful QUEUED claim', async () => {
    const { service, sendMessage, prisma } = createService({
      message: baseMessage('QUEUED'),
    });
    await service.sendQueuedMessage('a1', 'm1', 'e1');
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(prisma.emailMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deliveryStatus: 'SENT' }) }),
    );
  });

  it('throws transient errors so BullMQ can retry', async () => {
    const transient = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
    const { service, prisma } = createService({
      message: baseMessage('QUEUED'),
      sendMessage: vi.fn().mockRejectedValue(transient),
    });
    await expect(service.sendQueuedMessage('a1', 'm1', 'e1')).rejects.toThrow('socket hang up');
    expect(prisma.emailMessage.update).not.toHaveBeenCalled();
  });

  it('marks ambiguous failures without retry', async () => {
    const { service, prisma } = createService({
      message: baseMessage('QUEUED'),
      sendMessage: vi.fn().mockRejectedValue(new MailAmbiguousSendError('timeout after submit')),
    });
    await expect(service.sendQueuedMessage('a1', 'm1', 'e1')).resolves.toBeUndefined();
    expect(prisma.emailMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deliveryStatus: 'FAILED' }) }),
    );
    expect(prisma.mailDeliveryLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kind: 'OUTCOME_UNKNOWN' }) }),
    );
  });
});
