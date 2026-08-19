import { describe, expect, it } from 'vitest';
import { splitSearchHighlight } from './highlight-search-match';

describe('splitSearchHighlight', () => {
  it('returns single non-match segment when query is empty', () => {
    expect(splitSearchHighlight('Sipan Project', '')).toEqual([
      { text: 'Sipan Project', match: false },
    ]);
  });

  it('highlights case-insensitive matches', () => {
    expect(splitSearchHighlight('Sipan delivery', 'sip')).toEqual([
      { text: 'Sip', match: true },
      { text: 'an delivery', match: false },
    ]);
  });

  it('does not inject markup — segments preserve original casing', () => {
    const segments = splitSearchHighlight('<script>x</script>', 'script');
    expect(segments.some((part) => part.match && part.text === 'script')).toBe(true);
    expect(JSON.stringify(segments)).not.toContain('<b>');
  });
});
