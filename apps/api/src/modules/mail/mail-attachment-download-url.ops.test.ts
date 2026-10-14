import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMailAttachmentDownloadUrl } from './mail-attachment-download-url.ops';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';

vi.mock('./mail-thread-message-access.ops', () => ({
  fetchMailThreadMessageForEdit: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://files.example/invoice.pdf'),
}));

const findFirst = vi.fn();

describe('createMailAttachmentDownloadUrl', () => {
  beforeEach(() => {
    findFirst.mockReset();
    vi.mocked(fetchMailThreadMessageForEdit).mockResolvedValue({
      status: 'ok',
      thread: {} as never,
      message: {} as never,
    });
  });

  it('signs a READY Drive file for someone who can read the thread', async () => {
    findFirst.mockResolvedValue(readyRow());
    const result = await createMailAttachmentDownloadUrl(params());
    expect(result).toEqual({
      url: 'https://files.example/invoice.pdf',
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('refuses an attachment that is still downloading', async () => {
    findFirst.mockResolvedValue({ ...readyRow(), downloadStatus: 'PENDING', fileAsset: null });
    await expect(createMailAttachmentDownloadUrl(params())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

function params() {
  return {
    prisma: { emailAttachment: { findFirst } } as never,
    r2: { bucket: 'mail', ensureS3: () => ({}) } as never,
    employeeId: 'e1',
    accessScope: 'OWN',
    threadId: 't1',
    messageId: 'm1',
    attachmentId: 'a1',
  };
}

function readyRow() {
  return {
    fileName: 'invoice.pdf',
    mimeType: 'application/pdf',
    downloadStatus: 'READY',
    fileAsset: {
      deletedAt: null,
      storageProvider: 'R2',
      storageKey: 'mail/invoice.pdf',
      externalUrl: null,
      mimeType: 'application/pdf',
      versions: [{ storageKey: 'mail/invoice.pdf' }],
    },
  };
}
