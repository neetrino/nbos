import { describe, expect, it } from 'vitest';
import { attachmentContentDisposition } from './mail-attachment-content-disposition';

describe('attachmentContentDisposition', () => {
  it('forces a download and keeps a plain filename', () => {
    expect(attachmentContentDisposition('invoice.pdf')).toBe(
      `attachment; filename="invoice.pdf"; filename*=UTF-8''invoice.pdf`,
    );
  });

  it('strips quotes and newlines so the header cannot be split', () => {
    const value = attachmentContentDisposition('a"b\r\n.pdf');
    expect(value.startsWith('attachment; filename="')).toBe(true);
    expect(value).not.toContain('\n');
    expect(value).not.toContain('\r');
  });
});
