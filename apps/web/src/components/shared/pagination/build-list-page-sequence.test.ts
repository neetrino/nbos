import { describe, it, expect } from 'vitest';
import { buildListPageSequence } from './build-list-page-sequence';

describe('buildListPageSequence', () => {
  it('returns empty when no pages', () => {
    expect(buildListPageSequence(1, 0)).toEqual([]);
  });

  it('returns all pages when total is small', () => {
    expect(buildListPageSequence(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('includes ellipsis for large page counts', () => {
    expect(buildListPageSequence(5, 12)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 12]);
  });
});
