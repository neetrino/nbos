import { describe, expect, it } from 'vitest';
import { journalHasMorePages } from './call-journal-page';

describe('journalHasMorePages', () => {
  it('is true only before the last page', () => {
    expect(journalHasMorePages({ page: 1, totalPages: 2 })).toBe(true);
    expect(journalHasMorePages({ page: 1, totalPages: 1 })).toBe(false);
  });
});
