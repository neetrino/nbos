import { describe, expect, it } from 'vitest';
import type { Attachment, ParsedMail } from 'mailparser';
import { MailAttachmentPermanentError } from '../mail-provider-error.classify';
import {
  collectImapAttachments,
  extractImapAttachment,
  imapProviderAttachmentId,
  parseImapPartSection,
  type ImapBodyStructureNode,
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

const mixedStructure: ImapBodyStructureNode = {
  type: 'multipart/mixed',
  childNodes: [
    { part: '1', type: 'text/plain' },
    {
      part: '2',
      type: 'application/pdf',
      dispositionParameters: { filename: 'doc.pdf' },
    },
    {
      type: 'multipart/related',
      childNodes: [
        { part: '3.1', type: 'text/html' },
        {
          part: '3.2',
          type: 'image/png',
          id: '<sig-1>',
          dispositionParameters: { filename: 'sig.png' },
        },
      ],
    },
  ],
};

describe('IMAP attachment metadata', () => {
  it('prefers cid as a stable providerAttachmentId', () => {
    expect(imapProviderAttachmentId({ contentId: '<cid-1>', filename: 'a.png' }, 0)).toBe('cid-1');
    expect(imapProviderAttachmentId({ filename: 'a.png' }, 2)).toBe('part:2:a.png');
    expect(imapProviderAttachmentId({ filename: 'a.png' }, 2, '1.2')).toBe('imap-part:1.2');
    expect(imapProviderAttachmentId({ contentId: '<cid-1>', filename: 'a.png' }, 0, '1.2')).toBe(
      'cid-1',
    );
  });

  it('stores BODYSTRUCTURE section ids when cid is absent', () => {
    const parsed = {
      attachments: [
        attachment({ filename: 'doc.pdf', contentType: 'application/pdf' }),
        attachment({
          filename: 'sig.png',
          contentId: '<sig-1>',
          contentDisposition: 'inline',
          related: true,
        }),
      ],
    } as ParsedMail;
    expect(collectImapAttachments(parsed, mixedStructure)).toEqual([
      {
        providerAttachmentId: 'imap-part:2',
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 12,
        isInline: false,
      },
      {
        providerAttachmentId: 'sig-1',
        fileName: 'sig.png',
        mimeType: 'image/png',
        sizeBytes: 12,
        isInline: true,
      },
    ]);
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

  it('re-extracts the matching part for a legacy part:{n}:name id', () => {
    const parsed = {
      attachments: [attachment({ filename: 'a.txt', content: Buffer.from('aaa') })],
    } as ParsedMail;
    const downloaded = extractImapAttachment(parsed, 'part:0:a.txt');
    expect(downloaded.filename).toBe('a.txt');
    expect(downloaded.content.toString()).toBe('aaa');
  });

  it('extracts a legacy part:{n}:name id when parser index drifted', () => {
    const parsed = {
      attachments: [
        attachment({ filename: 'sig.png', content: Buffer.from('sig') }),
        attachment({ filename: 'a.txt', content: Buffer.from('aaa') }),
      ],
    } as ParsedMail;
    const downloaded = extractImapAttachment(parsed, 'part:0:a.txt');
    expect(downloaded.filename).toBe('a.txt');
    expect(downloaded.content.toString()).toBe('aaa');
  });

  it('throws a permanent error when the attachment part is missing', () => {
    const parsed = { attachments: [] } as ParsedMail;
    expect(() => extractImapAttachment(parsed, 'part:0:gone.txt')).toThrow(
      MailAttachmentPermanentError,
    );
    expect(parseImapPartSection('imap-part:1.2')).toBe('1.2');
    expect(parseImapPartSection('part:0:a.txt')).toBeNull();
  });
});
