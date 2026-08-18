import { describe, expect, it } from 'vitest';
import type { Attachment, ParsedMail } from 'mailparser';
import {
  collectImapAttachments,
  extractImapAttachment,
  imapProviderAttachmentId,
} from './imap-message.attachments';
import { normalizeParsedMail } from './imap-message.normalize';

function attachment(overrides: Partial<Attachment> & { content?: Buffer }): Attachment {
  return {
    filename: 'photo.png',
    contentType: 'image/png',
    size: 12,
    contentDisposition: 'attachment',
    related: false,
    content: Buffer.from('png'),
    ...overrides,
  } as Attachment;
}

describe('IMAP attachment metadata', () => {
  it('prefers cid as a stable providerAttachmentId', () => {
    expect(imapProviderAttachmentId({ contentId: '<cid-1>', filename: 'a.png' }, 0)).toBe('cid-1');
    expect(imapProviderAttachmentId({ filename: 'a.png' }, 2)).toBe('part:2:a.png');
  });

  it('normalizes metadata without exposing bytes on the message', () => {
    const parsed = {
      attachments: [
        attachment({ contentId: '<img-1>', contentDisposition: 'inline', related: true }),
      ],
      subject: 'Pic',
      text: 'see image',
      html: false,
      date: new Date('2026-08-19T00:00:00.000Z'),
    } as ParsedMail;
    const normalized = normalizeParsedMail(parsed, 44);
    expect(normalized.attachments).toEqual([
      {
        providerAttachmentId: 'img-1',
        fileName: 'photo.png',
        mimeType: 'image/png',
        sizeBytes: 12,
        isInline: true,
      },
    ]);
    expect(collectImapAttachments(parsed)[0]).not.toHaveProperty('content');
  });

  it('re-extracts the matching part for download', () => {
    const parsed = {
      attachments: [attachment({ filename: 'a.txt', content: Buffer.from('aaa') })],
    } as ParsedMail;
    const downloaded = extractImapAttachment(parsed, 'part:0:a.txt');
    expect(downloaded.filename).toBe('a.txt');
    expect(downloaded.content.toString()).toBe('aaa');
  });
});
