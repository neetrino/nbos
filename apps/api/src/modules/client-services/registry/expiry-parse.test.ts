import { describe, expect, it } from 'vitest';
import {
  isRegistryExpiryLater,
  isWhoisNotFound,
  parseRdapExpiry,
  parseWhoisExpiryDate,
} from './expiry-parse';

describe('parseWhoisExpiryDate', () => {
  it('reads amNIC Expires', () => {
    const date = parseWhoisExpiryDate('   Expires:       2026-09-21\n');
    expect(date?.toISOString().startsWith('2026-09-21')).toBe(true);
  });

  it('reads .ru paid-till', () => {
    const date = parseWhoisExpiryDate('paid-till: 2026-12-02T21:00:00Z');
    expect(date?.toISOString()).toBe('2026-12-02T21:00:00.000Z');
  });

  it('reads gTLD Registry Expiry Date', () => {
    const date = parseWhoisExpiryDate('Registry Expiry Date: 2027-02-03T11:00:38Z');
    expect(date?.toISOString()).toBe('2027-02-03T11:00:38.000Z');
  });
});

describe('isWhoisNotFound', () => {
  it('detects amNIC no match', () => {
    expect(isWhoisNotFound('%\nNo match\n')).toBe(true);
  });
});

describe('parseRdapExpiry', () => {
  it('reads expiration events', () => {
    const date = parseRdapExpiry([
      { eventAction: 'registration', eventDate: '2020-01-01T00:00:00Z' },
      { eventAction: 'expiration', eventDate: '2027-02-27T13:48:11.61Z' },
    ]);
    expect(date?.toISOString().startsWith('2027-02-27')).toBe(true);
  });
});

describe('isRegistryExpiryLater', () => {
  it('compares UTC calendar days', () => {
    expect(
      isRegistryExpiryLater(new Date('2027-02-03T00:00:00Z'), new Date('2026-02-03T23:00:00Z')),
    ).toBe(true);
    expect(
      isRegistryExpiryLater(new Date('2026-02-03T23:00:00Z'), new Date('2026-02-03T00:00:00Z')),
    ).toBe(false);
  });
});
