import { describe, expect, it } from 'vitest';
import { buildRawGmailMessage } from './gmail-mime';

describe('buildRawGmailMessage', () => {
  it('embeds outbound FileAsset bytes as a MIME attachment', () => {
    const raw = buildRawGmailMessage({
      fromEmail: 'from@x.com',
      fromName: 'From',
      to: ['to@x.com'],
      cc: [],
      bcc: [],
      subject: 'Hello',
      bodyText: 'plain',
      attachments: [
        {
          filename: 'note.txt',
          content: Buffer.from('file-bytes'),
          contentType: 'text/plain',
        },
      ],
    });
    const decoded = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    expect(decoded).toContain('multipart/mixed');
    expect(decoded).toContain('filename="note.txt"');
    expect(decoded).toContain(Buffer.from('file-bytes').toString('base64'));
  });
});
