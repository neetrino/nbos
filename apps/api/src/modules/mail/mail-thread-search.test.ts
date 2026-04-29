import { describe, expect, it } from 'vitest';
import { MAIL_THREAD_SEARCH_QUERY_MAX_CHARS } from './mail-thread-search.constants';
import { normalizeMailThreadSearchQuery } from './mail-thread-search';

describe('normalizeMailThreadSearchQuery', () => {
  it('returns undefined for empty or whitespace', () => {
    expect(normalizeMailThreadSearchQuery(undefined)).toBeUndefined();
    expect(normalizeMailThreadSearchQuery('')).toBeUndefined();
    expect(normalizeMailThreadSearchQuery('  \t')).toBeUndefined();
  });

  it('trims leading and trailing space', () => {
    expect(normalizeMailThreadSearchQuery('  hello  ')).toBe('hello');
  });

  it('truncates beyond max length', () => {
    const long = 'a'.repeat(MAIL_THREAD_SEARCH_QUERY_MAX_CHARS + 50);
    const out = normalizeMailThreadSearchQuery(long);
    expect(out?.length).toBe(MAIL_THREAD_SEARCH_QUERY_MAX_CHARS);
  });
});
