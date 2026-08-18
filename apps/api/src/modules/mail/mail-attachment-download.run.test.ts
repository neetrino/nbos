import { describe, expect, it, vi } from 'vitest';
import { MAIL_ATTACHMENT_MAX_BYTES } from './mail-attachment.constants';
import { executeAttachmentDownload } from './mail-attachment-download.run';
import { MailAttachmentPermanentError } from './mail-provider-error.classify';

function attachmentRow(overrides?: {
  downloadStatus?: string;
  sizeBytes?: bigint | null;
  providerAttachmentId?: string | null;
  accountStatus?: string;
}) {
  return {
    id: 'att-1',
    messageId: 'msg-1',
    fileName: 'doc.pdf',
    mimeType: 'application/pdf',
    sizeBytes: overrides && 'sizeBytes' in overrides ? overrides.sizeBytes : 10n,
    providerAttachmentId:
      overrides && 'providerAttachmentId' in overrides
        ? overrides.providerAttachmentId
        : 'prov-att',
    downloadStatus: overrides?.downloadStatus ?? 'PENDING',
    message: {
      id: 'msg-1',
      providerMessageId: 'prov-msg',
      mailAccountId: 'acc-1',
      mailAccount: {
        id: 'acc-1',
        emailAddress: 'me@x.com',
        displayName: 'Me',
        providerType: 'GMAIL',
        status: overrides?.accountStatus ?? 'ACTIVE',
        ownerEmployeeId: 'emp-1',
        providerConnection: {
          username: null,
          imapHost: null,
          imapPort: null,
          secureMode: null,
          smtpHost: null,
          smtpPort: null,
          smtpSecureMode: null,
        },
      },
    },
  };
}

function createRun(options: {
  row: ReturnType<typeof attachmentRow> | null;
  downloadAttachment?: ReturnType<typeof vi.fn>;
  createGeneratedFileAsset?: ReturnType<typeof vi.fn>;
}) {
  const prisma = {
    emailAttachment: {
      findUnique: vi.fn().mockResolvedValue(options.row),
      update: vi.fn(),
    },
    mailAccount: { updateMany: vi.fn() },
    mailProviderConnection: { updateMany: vi.fn() },
  };
  const downloadAttachment =
    options.downloadAttachment ??
    vi.fn().mockResolvedValue({
      filename: 'doc.pdf',
      contentType: 'application/pdf',
      content: Buffer.from('pdf-bytes'),
    });
  const createGeneratedFileAsset =
    options.createGeneratedFileAsset ?? vi.fn().mockResolvedValue({ id: 'file-1' });
  return {
    prisma,
    downloadAttachment,
    createGeneratedFileAsset,
    run: () =>
      executeAttachmentDownload({
        prisma: prisma as never,
        adapterFactory: {
          forConnection: vi.fn().mockResolvedValue({ downloadAttachment }),
        } as never,
        driveService: { createGeneratedFileAsset } as never,
        config: { get: vi.fn().mockReturnValue('org-1') } as never,
        messageId: 'msg-1',
        attachmentId: 'att-1',
        logError: vi.fn(),
        logWarn: vi.fn(),
      }),
  };
}

describe('executeAttachmentDownload', () => {
  it('stores a Drive FileAsset and marks READY', async () => {
    const { run, prisma, createGeneratedFileAsset } = createRun({ row: attachmentRow() });
    await expect(run()).resolves.toEqual({});
    expect(createGeneratedFileAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceModule: 'MAIL',
        purpose: 'OTHER',
        visibility: 'RESTRICTED',
        confidentiality: 'CONFIDENTIAL',
        link: expect.objectContaining({
          entityType: 'email_message',
          entityId: 'msg-1',
          linkType: 'ATTACHMENT',
        }),
      }),
    );
    expect(prisma.emailAttachment.update).toHaveBeenCalledWith({
      where: { id: 'att-1' },
      data: expect.objectContaining({ downloadStatus: 'READY', fileAssetId: 'file-1' }),
    });
  });

  it('throws transient provider errors for BullMQ retry', async () => {
    const error = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
    const { run, prisma } = createRun({
      row: attachmentRow(),
      downloadAttachment: vi.fn().mockRejectedValue(error),
    });
    await expect(run()).rejects.toBe(error);
    expect(prisma.emailAttachment.update).not.toHaveBeenCalled();
  });

  it('marks FAILED and does not throw on permanent / oversize', async () => {
    const permanent = createRun({
      row: attachmentRow(),
      downloadAttachment: vi
        .fn()
        .mockRejectedValue(new MailAttachmentPermanentError('IMAP attachment part not found')),
    });
    await expect(permanent.run()).resolves.toEqual({ errorClass: 'permanent' });
    expect(permanent.prisma.emailAttachment.update).toHaveBeenCalledWith({
      where: { id: 'att-1' },
      data: { downloadStatus: 'FAILED' },
    });

    const oversize = createRun({
      row: attachmentRow({ sizeBytes: BigInt(MAIL_ATTACHMENT_MAX_BYTES + 1) }),
    });
    await expect(oversize.run()).resolves.toEqual({ errorClass: 'permanent' });
    expect(oversize.downloadAttachment).not.toHaveBeenCalled();
  });
});
