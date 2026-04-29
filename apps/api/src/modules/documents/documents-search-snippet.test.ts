import { describe, it, expect } from 'vitest';
import { pickDocumentSearchSnippet } from './documents-search-snippet';

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
});
