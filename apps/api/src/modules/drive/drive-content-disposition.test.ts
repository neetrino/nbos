import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assetViewResponseHeaders,
  attachmentContentDisposition,
  parseAssetViewDisposition,
} from './drive-content-disposition';

describe('parseAssetViewDisposition', () => {
  it('defaults empty and inline to preview', () => {
    expect(parseAssetViewDisposition(undefined)).toBe('inline');
    expect(parseAssetViewDisposition('  inline  ')).toBe('inline');
  });

  it('accepts attachment', () => {
    expect(parseAssetViewDisposition('attachment')).toBe('attachment');
  });

  it('rejects unknown values', () => {
    expect(() => parseAssetViewDisposition('inline; filename=evil')).toThrow(BadRequestException);
  });
});

describe('attachmentContentDisposition', () => {
  it('keeps a safe ascii name and an encoded original', () => {
    const header = attachmentContentDisposition('Neetrino Marketing KP.pdf');
    expect(header).toContain('filename="Neetrino Marketing KP.pdf"');
    expect(header).toContain("filename*=UTF-8''Neetrino%20Marketing%20KP.pdf");
  });

  it('strips quotes and encodes non-ascii names', () => {
    const header = attachmentContentDisposition('отчёт "q".pdf');
    expect(header).not.toContain('"q"');
    expect(header.startsWith('attachment; filename="')).toBe(true);
    expect(header).toContain("filename*=UTF-8''");
    expect(header).toContain('%D0%BE');
  });
});

describe('assetViewResponseHeaders', () => {
  it('omits content disposition for inline preview', () => {
    expect(
      assetViewResponseHeaders({
        mimeType: 'application/pdf',
        displayName: 'brief.pdf',
        disposition: 'inline',
      }),
    ).toEqual({ ResponseContentType: 'application/pdf' });
  });

  it('sets attachment disposition for download', () => {
    const headers = assetViewResponseHeaders({
      mimeType: 'application/pdf',
      displayName: 'brief.pdf',
      disposition: 'attachment',
    });
    expect(headers.ResponseContentDisposition).toContain('attachment;');
    expect(headers.ResponseContentDisposition).toContain('filename="brief.pdf"');
  });
});
