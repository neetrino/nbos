import { Readable } from 'node:stream';
import type { ImapFlow } from 'imapflow';
import { describe, expect, it } from 'vitest';
import { MailAttachmentPermanentError } from '../mail-provider-error.classify';
import { downloadImapBodyPart } from './imap-part-download';

function fakeClient(result: unknown): Pick<ImapFlow, 'download'> {
  return {
    download: async () => result as Awaited<ReturnType<ImapFlow['download']>>,
  };
}

describe('IMAP BODYSTRUCTURE part download', () => {
  it('returns decoded bytes for an existing section', async () => {
    const downloaded = await downloadImapBodyPart(
      fakeClient({
        meta: { filename: 'doc.pdf', contentType: 'application/pdf', expectedSize: 3 },
        content: Readable.from([Buffer.from('pdf')]),
      }) as ImapFlow,
      12,
      '1.2',
    );
    expect(downloaded.filename).toBe('doc.pdf');
    expect(downloaded.contentType).toBe('application/pdf');
    expect(downloaded.content.toString()).toBe('pdf');
  });

  it('throws a permanent error when the IMAP part is missing', async () => {
    await expect(
      downloadImapBodyPart(fakeClient({}) as ImapFlow, 12, '9.9'),
    ).rejects.toBeInstanceOf(MailAttachmentPermanentError);
  });
});
