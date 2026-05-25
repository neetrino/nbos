import { describe, expect, it } from 'vitest';
import {
  contactIdListsEqual,
  mergeEntityContactIds,
  splitEntityContactIds,
} from './entity-contact-list';

describe('mergeEntityContactIds', () => {
  it('dedupes primary from additional', () => {
    expect(mergeEntityContactIds('a', ['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('splitEntityContactIds', () => {
  it('splits first as primary', () => {
    expect(splitEntityContactIds(['a', 'b', 'c'])).toEqual({
      primaryContactId: 'a',
      additionalContactIds: ['b', 'c'],
    });
  });
});

describe('contactIdListsEqual', () => {
  it('compares order-independent', () => {
    expect(contactIdListsEqual(['a', 'b'], ['b', 'a'])).toBe(true);
  });
});
