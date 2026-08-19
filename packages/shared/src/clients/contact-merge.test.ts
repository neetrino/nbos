import { describe, expect, it } from 'vitest';
import { canMergeContacts, canOfferContactMerge } from './contact-merge';

describe('canMergeContacts', () => {
  it('allows Owner, CEO, and PM', () => {
    expect(canMergeContacts('owner')).toBe(true);
    expect(canMergeContacts('ceo')).toBe(true);
    expect(canMergeContacts('pm')).toBe(true);
  });

  it('blocks Seller and Marketing', () => {
    expect(canMergeContacts('seller')).toBe(false);
    expect(canMergeContacts('marketing')).toBe(false);
    expect(canMergeContacts('head-marketing')).toBe(false);
  });

  it('blocks other roles', () => {
    expect(canMergeContacts('developer')).toBe(false);
    expect(canOfferContactMerge(null)).toBe(false);
  });
});
