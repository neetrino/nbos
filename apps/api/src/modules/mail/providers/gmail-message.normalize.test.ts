import { describe, expect, it } from 'vitest';
import { normalizeGmailMessage } from './gmail-message.normalize';

describe('normalizeGmailMessage attachments', () => {
  it('extracts attachment metadata and skips text body parts', () => {
    const normalized = normalizeGmailMessage({
      id: 'gm-1',
      threadId: 'th-1',
      internalDate: '1710000000000',
      payload: {
        headers: [{ name: 'Subject', value: 'With file' }],
        mimeType: 'multipart/mixed',
        parts: [
          { mimeType: 'text/plain', body: { data: 'SGVsbG8=' } },
          { mimeType: 'text/html', body: { data: 'PGgxPkhpPC9oMT4=' } },
          {
            filename: 'invoice.pdf',
            mimeType: 'application/pdf',
            headers: [{ name: 'Content-Disposition', value: 'attachment; filename="invoice.pdf"' }],
            body: { attachmentId: 'att-gmail-1', size: 2048 },
          },
        ],
      },
    });
    expect(normalized.bodyText).toBe('Hello');
    expect(normalized.attachments).toEqual([
      {
        providerAttachmentId: 'att-gmail-1',
        fileName: 'invoice.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        isInline: false,
      },
    ]);
  });
});
