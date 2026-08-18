import { describe, expect, it, vi } from 'vitest';
import { MailAmbiguousSendError, MailAttachmentLoadError } from './mail-provider-error.classify';
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

function attachmentRow(overrides?: { storageKey?: string | null; storageProvider?: string }) {
  return {
    id: 'att-1',
    fileName: 'doc.pdf',
    mimeType: 'application/pdf',
    isInline: false,
    fileAsset: {
      storageKey: overrides && 'storageKey' in overrides ? overrides.storageKey : 'mail/doc.pdf',
      storageProvider: overrides?.storageProvider ?? 'R2',
      mimeType: 'application/pdf',
      versions: [] as Array<{ storageKey: string }>,
    },
  };
}

function createService(options: {
  message: ReturnType<typeof baseMessage>;
  claimCount?: number;
  sendMessage?: ReturnType<typeof vi.fn>;
  attachmentRows?: ReturnType<typeof attachmentRow>[];
  r2Send?: ReturnType<typeof vi.fn>;
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
    emailAttachment: { findMany: vi.fn().mockResolvedValue(options.attachmentRows ?? []) },
    mailDeliveryLog: { create: vi.fn() },
  };
  const adapterFactory = { forConnection: vi.fn().mockResolvedValue({ sendMessage }) };
  const r2Send = options.r2Send ?? vi.fn();
  const service = new MailSendService(
    prisma as never,
    adapterFactory as never,
    { log: vi.fn() } as never,
    { bucket: 'b', ensureS3: vi.fn().mockReturnValue({ send: r2Send }) } as never,
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

  it('throws when attachment rows exist but R2 bytes are missing', async () => {
    const { service, sendMessage, prisma, adapterFactory } = createService({
      message: baseMessage('QUEUED'),
      attachmentRows: [attachmentRow()],
      r2Send: vi.fn().mockResolvedValue({ Body: undefined }),
    });
    await expect(service.sendQueuedMessage('a1', 'm1', 'e1')).rejects.toBeInstanceOf(
      MailAttachmentLoadError,
    );
    expect(adapterFactory.forConnection).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
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
