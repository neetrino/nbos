import { describe, expect, it, vi } from 'vitest';
import { MailAttachmentLoadError } from './mail-provider-error.classify';
import { loadOutboundAttachmentParts } from './mail-send-attachments.ops';

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

function createDeps(options?: {
  rows?: ReturnType<typeof attachmentRow>[];
  r2Send?: ReturnType<typeof vi.fn>;
}) {
  const prisma = {
    emailAttachment: { findMany: vi.fn().mockResolvedValue(options?.rows ?? []) },
  };
  const r2Send = options?.r2Send ?? vi.fn();
  const r2 = { bucket: 'b', ensureS3: vi.fn().mockReturnValue({ send: r2Send }) };
  return { prisma, r2, r2Send };
}

describe('loadOutboundAttachmentParts', () => {
  it('returns empty parts when the message has no attachment rows', async () => {
    const { prisma, r2, r2Send } = createDeps();
    await expect(
      loadOutboundAttachmentParts(prisma as never, r2 as never, 'm1', null),
    ).resolves.toEqual([]);
    expect(r2Send).not.toHaveBeenCalled();
  });

  it('throws when attachment rows exist but R2 body is missing', async () => {
    const { prisma, r2, r2Send } = createDeps({
      rows: [attachmentRow()],
      r2Send: vi.fn().mockResolvedValue({ Body: undefined }),
    });
    await expect(
      loadOutboundAttachmentParts(prisma as never, r2 as never, 'm1', null),
    ).rejects.toBeInstanceOf(MailAttachmentLoadError);
    expect(r2Send).toHaveBeenCalled();
  });

  it('wraps R2 network errors as a transient attachment load failure', async () => {
    const networkError = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
    const { prisma, r2 } = createDeps({
      rows: [attachmentRow()],
      r2Send: vi.fn().mockRejectedValue(networkError),
    });
    const thrown = await loadOutboundAttachmentParts(
      prisma as never,
      r2 as never,
      'm1',
      null,
    ).catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(MailAttachmentLoadError);
    expect(thrown).toHaveProperty('cause', networkError);
  });

  it('loads bytes when R2 returns a body', async () => {
    const { prisma, r2 } = createDeps({
      rows: [attachmentRow()],
      r2Send: vi.fn().mockResolvedValue({
        Body: {
          async *[Symbol.asyncIterator]() {
            yield new Uint8Array([1, 2, 3]);
          },
        },
      }),
    });
    const parts = await loadOutboundAttachmentParts(prisma as never, r2 as never, 'm1', null);
    expect(parts).toHaveLength(1);
    expect(parts[0]?.filename).toBe('doc.pdf');
    expect(parts[0]?.content.equals(Buffer.from([1, 2, 3]))).toBe(true);
  });
});
