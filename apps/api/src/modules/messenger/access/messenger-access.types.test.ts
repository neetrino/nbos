import { describe, expect, it } from 'vitest';
import { messengerViewBypassesRowFilter } from './messenger-access.types';

describe('messengerViewBypassesRowFilter', () => {
  it('bypasses only ALL scope', () => {
    expect(messengerViewBypassesRowFilter('ALL')).toBe(true);
    expect(messengerViewBypassesRowFilter('OWN')).toBe(false);
    expect(messengerViewBypassesRowFilter('DEPARTMENT')).toBe(false);
    expect(messengerViewBypassesRowFilter('NONE')).toBe(false);
    expect(messengerViewBypassesRowFilter(null)).toBe(false);
  });
});
