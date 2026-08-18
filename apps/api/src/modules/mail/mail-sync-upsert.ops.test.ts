import { describe, expect, it, vi } from 'vitest';
import { MAIL_ATTACHMENT_MAX_BYTES } from './mail-attachment.constants';
import { upsertNormalizedMessages } from './mail-sync-upsert.ops';
import type { NormalizedMessage } from './providers/mail-provider-adapter';

function inboundMessage(overrides?: Partial<NormalizedMessage>): NormalizedMessage {
  return {
    providerMessageId: 'prov-1',
    messageIdHeader: '<id>',
    providerThreadId: 'th-1',
    subject: 'Hello',
    bodyText: 'body',
    bodyHtml: null,
    sentAt: null,
    receivedAt: new Date('2026-08-19T00:00:00.000Z'),
    direction: 'INBOUND',
    recipients: [],
    attachments: [
      {
        providerAttachmentId: 'att-prov-1',
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        isInline: false,
      },
    ],
    ...overrides,
  };
}

function createPrisma(options: {
  existingMessage?: boolean;
  uniqueOnCreate?: boolean;
  createdAttachmentId?: string;
}) {
  const createdAttachment = { id: options.createdAttachmentId ?? 'att-row-1' };
  const tx = {
    emailThread: {
      findFirst: vi.fn().mockResolvedValue({ id: 'thread-1' }),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailMessage: {
      findFirst: vi.fn().mockResolvedValue(options.existingMessage ? { id: 'msg-old' } : null),
      create: options.uniqueOnCreate
        ? vi.fn().mockRejectedValue({ code: 'P2002' })
        : vi.fn().mockResolvedValue({ id: 'msg-1' }),
    },
    emailRecipient: { createMany: vi.fn() },
    emailAttachment: { create: vi.fn().mockResolvedValue(createdAttachment) },
  };
  return {
    tx,
    prisma: {
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    },
  };
}

describe('upsertNormalizedMessages attachments', () => {
  it('creates PENDING attachments with null fileAssetId and returns enqueue ids', async () => {
    const { prisma, tx } = createPrisma({});
    const result = await upsertNormalizedMessages(prisma as never, 'acc-1', [inboundMessage()]);
    expect(result.stored).toBe(1);
    expect(result.pendingDownloads).toEqual([{ messageId: 'msg-1', attachmentId: 'att-row-1' }]);
    expect(tx.emailAttachment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        messageId: 'msg-1',
        fileName: 'doc.pdf',
        providerAttachmentId: 'att-prov-1',
        downloadStatus: 'PENDING',
        sizeBytes: 1024n,
      }),
    });
    const data = tx.emailAttachment.create.mock.calls[0]?.[0]?.data as { fileAssetId?: unknown };
    expect(data.fileAssetId).toBeUndefined();
  });

  it('skips unique duplicates and does not re-enqueue attachments', async () => {
    const { prisma, tx } = createPrisma({ existingMessage: true });
    const result = await upsertNormalizedMessages(prisma as never, 'acc-1', [inboundMessage()]);
    expect(result).toEqual({ stored: 0, pendingDownloads: [] });
    expect(tx.emailAttachment.create).not.toHaveBeenCalled();
  });

  it('treats unique-violation on insert as a skip without enqueue', async () => {
    const { prisma, tx } = createPrisma({ uniqueOnCreate: true });
    const result = await upsertNormalizedMessages(prisma as never, 'acc-1', [inboundMessage()]);
    expect(result).toEqual({ stored: 0, pendingDownloads: [] });
    expect(tx.emailAttachment.create).not.toHaveBeenCalled();
  });

  it('marks known oversize attachments FAILED and does not enqueue', async () => {
    const { prisma, tx } = createPrisma({});
    const result = await upsertNormalizedMessages(prisma as never, 'acc-1', [
      inboundMessage({
        attachments: [
          {
            providerAttachmentId: 'big',
            fileName: 'huge.bin',
            mimeType: 'application/octet-stream',
            sizeBytes: MAIL_ATTACHMENT_MAX_BYTES + 1,
            isInline: false,
          },
        ],
      }),
    ]);
    expect(result.stored).toBe(1);
    expect(result.pendingDownloads).toEqual([]);
    expect(tx.emailAttachment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ downloadStatus: 'FAILED' }),
    });
  });
});
