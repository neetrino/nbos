import { describe, it, expect } from 'vitest';
import { escapeDocumentSearchLikePattern } from './documents-list-fts';

describe('escapeDocumentSearchLikePattern', () => {
  it('escapes LIKE metacharacters', () => {
    expect(escapeDocumentSearchLikePattern('a%b_c\\d')).toBe('a\\%b\\_c\\\\d');
  });
});
