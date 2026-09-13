import { describe, expect, it } from 'vitest';
import type { SearchQueryGroup } from '@/lib/api/search';
import { localizeSearchGroupLabel } from './localize-search-group-label';

describe('localizeSearchGroupLabel', () => {
  it('translates known group ids and keeps unknown API labels', () => {
    const t = (key: `groups.${SearchQueryGroup}`) => `t:${key}`;
    expect(localizeSearchGroupLabel('leads', 'Leads', t)).toBe('t:groups.leads');
    expect(localizeSearchGroupLabel('unknown', 'Custom', t)).toBe('Custom');
  });
});
