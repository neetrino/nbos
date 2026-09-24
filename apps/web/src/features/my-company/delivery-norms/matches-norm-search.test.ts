import { describe, expect, it } from 'vitest';
import { filterSearchOptions, matchesNormSearch } from './matches-norm-search';

describe('matchesNormSearch', () => {
  it('matches any part case-insensitively', () => {
    expect(matchesNormSearch('crm', ['Корпоративный сайт', 'CRM · Classic'])).toBe(true);
    expect(matchesNormSearch('SITE', ['company-site-code-classic'])).toBe(true);
    expect(matchesNormSearch('xyz', ['CRM'])).toBe(false);
  });

  it('treats blank query as a match', () => {
    expect(matchesNormSearch('  ', ['anything'])).toBe(true);
  });
});

describe('filterSearchOptions', () => {
  it('caps results after filtering', () => {
    const options = [
      { value: 'a', label: 'CRM Classic' },
      { value: 'b', label: 'Landing' },
      { value: 'c', label: 'CRM Large' },
    ];
    expect(filterSearchOptions(options, 'crm', 1)).toEqual([{ value: 'a', label: 'CRM Classic' }]);
  });
});
