import { describe, it, expect } from 'vitest';
import {
  collectAttachmentSearchNames,
  pickDocumentSearchSnippet,
} from './documents-search-snippet';

describe('pickDocumentSearchSnippet', () => {
  it('returns window around match in plain text', () => {
    const text = 'alpha ' + 'x'.repeat(300) + ' beta invoice gamma';
    const s = pickDocumentSearchSnippet(text, null, 't', 'invoice');
    expect(s).toContain('invoice');
    expect(s!.length).toBeLessThan(text.length);
  });

  it('falls back to description when plain text has no match', () => {
    const s = pickDocumentSearchSnippet('no match here', 'See invoice policy', 't', 'invoice');
    expect(s).toContain('invoice');
  });

  it('returns undefined when nothing matches', () => {
    expect(pickDocumentSearchSnippet('a', 'b', 'c', 'zzz')).toBeUndefined();
  });

  it('falls back to attachment file names when body and title miss', () => {
    const s = pickDocumentSearchSnippet('no match', null, 'Title', 'payroll', [
      'Q4 payroll export.xlsx',
    ]);
    expect(s).toContain('payroll');
  });
});

describe('collectAttachmentSearchNames', () => {
  it('dedupes when display equals original', () => {
    expect(
      collectAttachmentSearchNames([
        { fileAsset: { displayName: 'Spec.pdf', originalName: 'Spec.pdf' } },
      ]),
    ).toEqual(['Spec.pdf']);
  });

  it('includes both when display and original differ', () => {
    expect(
      collectAttachmentSearchNames([
        { fileAsset: { displayName: 'Shown name', originalName: 'raw.bin' } },
      ]),
    ).toEqual(['Shown name', 'raw.bin']);
  });
});
