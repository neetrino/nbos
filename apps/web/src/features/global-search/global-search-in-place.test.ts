import { describe, expect, it } from 'vitest';
import {
  GLOBAL_SEARCH_IN_PLACE_SHEET_TYPES,
  opensGlobalSearchInPlaceSheet,
} from './global-search-in-place';

describe('global-search-in-place', () => {
  it('opens sheets in place for supported entity types', () => {
    expect(GLOBAL_SEARCH_IN_PLACE_SHEET_TYPES.has('lead')).toBe(true);
    expect(GLOBAL_SEARCH_IN_PLACE_SHEET_TYPES.has('credential')).toBe(true);
    expect(opensGlobalSearchInPlaceSheet('invoice')).toBe(true);
  });

  it('keeps payment as navigation fallback', () => {
    expect(opensGlobalSearchInPlaceSheet('payment')).toBe(false);
  });
});
