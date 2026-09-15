import { describe, expect, it } from 'vitest';
import { canMergeContacts, canOfferContactMerge } from './contact-merge';

describe('canMergeContacts', () => {
  it('allows CEO, PM, and Founder identity — not the legacy owner slug', () => {
    expect(canMergeContacts('owner')).toBe(false);
    expect(canMergeContacts('pm', true)).toBe(true);
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
