import { describe, expect, it } from 'vitest';
import { parseRelationSearchName } from './parse-relation-search-name';

describe('parseRelationSearchName', () => {
  it('returns empty parts for blank input', () => {
    expect(parseRelationSearchName('   ')).toEqual({ firstName: '', lastName: '' });
  });

  it('uses single token as first name only', () => {
    expect(parseRelationSearchName('Acme')).toEqual({ firstName: 'Acme', lastName: '' });
  });

  it('splits on whitespace into first and last', () => {
    expect(parseRelationSearchName('Jane Doe')).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
    });
  });

  it('joins remaining tokens into last name', () => {
    expect(parseRelationSearchName('Jane van Der Berg')).toEqual({
      firstName: 'Jane',
      lastName: 'van Der Berg',
    });
  });
});
